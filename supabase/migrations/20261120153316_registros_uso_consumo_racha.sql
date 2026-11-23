-- Registros de uso: horas que un aparato estuvo encendido un día. El consumo (kWh) y el costo se calculan, no se guardan.
create table public.registros_uso (
  id bigint generated always as identity primary key,
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  aparato_id bigint not null references public.aparatos (id) on delete cascade,
  fecha date not null default (now() at time zone 'America/Bogota')::date,
  horas numeric(4, 2) not null check (horas > 0 and horas <= 24),
  origen text not null default 'manual' check (origen in ('manual', 'automatico')),
  creado_en timestamptz not null default now()
);
create index on public.registros_uso (usuario_id, fecha desc);
create index on public.registros_uso (aparato_id, fecha);
-- El registro automático diario es idempotente.
create unique index registros_uso_auto_uq on public.registros_uso (aparato_id, fecha) where origen = 'automatico';

alter table public.registros_uso enable row level security;
revoke all on public.registros_uso from anon, authenticated;
grant select, delete on public.registros_uso to authenticated;
grant insert (usuario_id, aparato_id, fecha, horas) on public.registros_uso to authenticated;
grant update (fecha, horas) on public.registros_uso to authenticated;

create policy "ver mi uso" on public.registros_uso for select to authenticated
  using (usuario_id = (select auth.uid()));
create policy "agregar mi uso" on public.registros_uso for insert to authenticated
  with check (usuario_id = (select auth.uid()));
create policy "editar mi uso" on public.registros_uso for update to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
create policy "borrar mi uso" on public.registros_uso for delete to authenticated
  using (usuario_id = (select auth.uid()));

-- Validaciones (invoker: RLS oculta los aparatos ajenos). Fechas en America/Bogota.
-- El ticket 8 añadirá aquí la regla "solo dentro del periodo abierto o extendido"; mientras no exista periodo: hasta 30 días atrás.
create function private.validar_registro_uso() returns trigger
language plpgsql security invoker set search_path = ''
as $$
declare
  hoy date := (now() at time zone 'America/Bogota')::date;
  v_archivado timestamptz;
  v_total numeric;
begin
  select archivado_en into v_archivado from public.aparatos where id = new.aparato_id and usuario_id = new.usuario_id;
  if not found then raise exception 'Aparato no encontrado' using errcode = 'check_violation'; end if;
  if tg_op = 'INSERT' and v_archivado is not null then
    raise exception 'El aparato está archivado' using errcode = 'check_violation';
  end if;
  if tg_op = 'INSERT' or new.fecha is distinct from old.fecha then
    if new.fecha > hoy then raise exception 'No se puede reportar uso en una fecha futura' using errcode = 'check_violation'; end if;
    if new.fecha < hoy - 30 then raise exception 'Solo se puede reportar hasta 30 días atrás' using errcode = 'check_violation'; end if;
  end if;
  select coalesce(sum(horas), 0) into v_total from public.registros_uso
    where aparato_id = new.aparato_id and fecha = new.fecha and id is distinct from new.id;
  if v_total + new.horas > 24 then
    raise exception 'Un aparato no puede pasar de 24 horas en un día' using errcode = 'check_violation';
  end if;
  return new;
end $$;
revoke execute on function private.validar_registro_uso() from public, anon, authenticated;
create trigger validar_registro_uso before insert or update on public.registros_uso
  for each row execute function private.validar_registro_uso();

-- Consumo calculado por registro: kWh = W x cantidad x h / 1000; costo con la tarifa vigente en la fecha.
create view public.consumo_calculado with (security_invoker = true) as
select r.id, r.usuario_id, r.aparato_id, r.fecha, r.horas, r.origen,
  round(a.potencia_w * a.cantidad * r.horas / 1000, 3) as kwh,
  round(a.potencia_w * a.cantidad * r.horas / 1000 * coalesce(public.tarifa_vigente(r.usuario_id, r.fecha), 0), 2) as costo
from public.registros_uso r join public.aparatos a on a.id = r.aparato_id;
revoke all on public.consumo_calculado from anon, authenticated;
grant select on public.consumo_calculado to authenticated;

-- Por aparato en un rango de fechas (por defecto, desde el día 1 del mes en Bogotá).
create function public.consumo_por_aparato(
  p_desde date default date_trunc('month', now() at time zone 'America/Bogota')::date,
  p_hasta date default (now() at time zone 'America/Bogota')::date)
returns table (aparato_id bigint, kwh numeric, costo numeric)
language sql stable security invoker set search_path = ''
as $$
  select c.aparato_id, sum(c.kwh), sum(c.costo) from public.consumo_calculado c
  where c.fecha between p_desde and p_hasta group by c.aparato_id
$$;
create function public.consumo_hogar(
  p_desde date default date_trunc('month', now() at time zone 'America/Bogota')::date,
  p_hasta date default (now() at time zone 'America/Bogota')::date)
returns table (kwh numeric, costo numeric)
language sql stable security invoker set search_path = ''
as $$
  select coalesce(sum(c.kwh), 0), coalesce(sum(c.costo), 0) from public.consumo_calculado c
  where c.fecha between p_desde and p_hasta
$$;

-- Racha: días consecutivos con algún reporte manual, terminando hoy (o ayer, si hoy aún no se reporta).
create function public.racha_dias() returns integer
language sql stable security invoker set search_path = ''
as $$
  with hoy as (select (now() at time zone 'America/Bogota')::date as d),
  dias as (select distinct fecha from public.registros_uso where origen = 'manual' and fecha <= (select d from hoy)),
  g as (select fecha, fecha - (row_number() over (order by fecha))::int as k from dias),
  i as (select count(*)::int as n, max(fecha) as fin from g group by k)
  select coalesce((select n from i where fin >= (select d from hoy) - 1 order by fin desc limit 1), 0)
$$;

revoke execute on function public.consumo_por_aparato(date, date), public.consumo_hogar(date, date), public.racha_dias() from public, anon;
grant execute on function public.consumo_por_aparato(date, date), public.consumo_hogar(date, date), public.racha_dias() to authenticated;

-- Registro diario automático de los aparatos de uso constante: a las 00:05 de Bogotá (05:05 UTC) registra el día que terminó.
-- Se omite el aparato que ya tiene reporte ese día. Las filas se pueden editar o borrar.
create function private.registrar_uso_constante() returns void
language sql security definer set search_path = ''
as $$
  insert into public.registros_uso (usuario_id, aparato_id, fecha, horas, origen)
  select a.usuario_id, a.id, ((now() at time zone 'America/Bogota')::date - 1), a.uso_tipico_horas, 'automatico'
  from public.aparatos a
  where a.uso_constante and a.archivado_en is null and a.uso_tipico_horas is not null
    and not exists (select 1 from public.registros_uso r
      where r.aparato_id = a.id and r.fecha = ((now() at time zone 'America/Bogota')::date - 1))
$$;
revoke execute on function private.registrar_uso_constante() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('registro-uso-constante', '5 5 * * *', 'select private.registrar_uso_constante()');
