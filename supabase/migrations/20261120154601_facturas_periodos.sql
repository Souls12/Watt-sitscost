-- Facturas y periodos (ticket 8). El periodo es explícito: nace al definir la meta sobre una factura.
create extension if not exists btree_gist with schema extensions;

create table public.facturas (
  id bigint generated always as identity primary key,
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kwh_facturado numeric(8, 2) not null check (kwh_facturado > 0),
  inicio date not null,
  fin date not null,
  creado_en timestamptz not null default now(),
  check (inicio < fin),
  -- Sin cruces entre facturas del mismo usuario (rangos inclusivos).
  constraint facturas_sin_cruce exclude using gist (usuario_id with =, daterange(inicio, fin, '[]') with &&)
);

alter table public.facturas enable row level security;
revoke all on public.facturas from anon, authenticated;
grant select, delete on public.facturas to authenticated;
grant insert (kwh_facturado, inicio, fin) on public.facturas to authenticated;
grant update (kwh_facturado, inicio, fin) on public.facturas to authenticated;
create policy "ver mis facturas" on public.facturas for select to authenticated using (usuario_id = (select auth.uid()));
create policy "agregar mis facturas" on public.facturas for insert to authenticated with check (usuario_id = (select auth.uid()));
create policy "editar mis facturas" on public.facturas for update to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
create policy "borrar mis facturas" on public.facturas for delete to authenticated using (usuario_id = (select auth.uid()));

create function private.validar_factura() returns trigger
language plpgsql security invoker set search_path = ''
as $$
begin
  if new.fin > (now() at time zone 'America/Bogota')::date then
    raise exception 'El periodo de la factura no puede ser futuro' using errcode = 'check_violation';
  end if;
  return new;
end $$;
revoke execute on function private.validar_factura() from public, anon, authenticated;
create trigger validar_factura before insert or update on public.facturas
  for each row execute function private.validar_factura();

create table public.periodos (
  id bigint generated always as identity primary key,
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  inicio date not null,
  fin_estimado date not null,
  fin_real date,
  estado text not null default 'abierto' check (estado in ('abierto', 'extendido', 'cerrado')),
  porcentaje numeric(5, 2) not null check (porcentaje > 0 and porcentaje < 100),
  meta_kwh numeric(8, 2) not null,
  factura_base_id bigint not null references public.facturas (id) on delete cascade,
  factura_cierre_id bigint references public.facturas (id) on delete set null,
  consumo_calculado_cierre numeric(10, 3),
  meta_modificada boolean not null default false,
  creado_en timestamptz not null default now()
);
-- Un solo periodo sin cerrar por usuario.
create unique index periodos_uno_abierto on public.periodos (usuario_id) where estado <> 'cerrado';
create index on public.periodos (factura_base_id);
create index on public.periodos (factura_cierre_id);

alter table public.periodos enable row level security;
revoke all on public.periodos from anon, authenticated;
grant select on public.periodos to authenticated;
grant insert (factura_base_id, porcentaje) on public.periodos to authenticated;
create policy "ver mis periodos" on public.periodos for select to authenticated using (usuario_id = (select auth.uid()));
create policy "crear mi periodo" on public.periodos for insert to authenticated with check (usuario_id = (select auth.uid()));

-- Al crear el periodo: empieza el día siguiente al fin de la factura y dura lo mismo que ella; meta = consumo facturado reducido.
create function private.crear_periodo() returns trigger
language plpgsql security invoker set search_path = ''
as $$
declare f public.facturas;
begin
  select * into f from public.facturas where id = new.factura_base_id;
  if not found then raise exception 'Factura no encontrada' using errcode = 'check_violation'; end if;
  new.inicio := f.fin + 1;
  new.fin_estimado := f.fin + (f.fin - f.inicio + 1);
  new.meta_kwh := round(f.kwh_facturado * (1 - new.porcentaje / 100), 2);
  return new;
end $$;
revoke execute on function private.crear_periodo() from public, anon, authenticated;
create trigger crear_periodo before insert on public.periodos
  for each row execute function private.crear_periodo();

-- Registro de uso: dentro del periodo sin cerrar (abierto o extendido); sin periodo, hasta 30 días atrás.
create or replace function private.validar_registro_uso() returns trigger
language plpgsql security invoker set search_path = ''
as $$
declare
  hoy date := (now() at time zone 'America/Bogota')::date;
  v_archivado timestamptz;
  v_total numeric;
  v_inicio date;
begin
  select archivado_en into v_archivado from public.aparatos where id = new.aparato_id and usuario_id = new.usuario_id;
  if not found then raise exception 'Aparato no encontrado' using errcode = 'check_violation'; end if;
  if tg_op = 'INSERT' and v_archivado is not null then
    raise exception 'El aparato está archivado' using errcode = 'check_violation';
  end if;
  if tg_op = 'INSERT' or new.fecha is distinct from old.fecha then
    if new.fecha > hoy then raise exception 'No se puede reportar uso en una fecha futura' using errcode = 'check_violation'; end if;
    select inicio into v_inicio from public.periodos where usuario_id = new.usuario_id and estado <> 'cerrado';
    if v_inicio is not null then
      if new.fecha < v_inicio then raise exception 'Solo se puede reportar dentro del periodo abierto' using errcode = 'check_violation'; end if;
    elsif new.fecha < hoy - 30 then
      raise exception 'Solo se puede reportar hasta 30 días atrás' using errcode = 'check_violation';
    end if;
  end if;
  select coalesce(sum(horas), 0) into v_total from public.registros_uso
    where aparato_id = new.aparato_id and fecha = new.fecha and id is distinct from new.id;
  if v_total + new.horas > 24 then
    raise exception 'Un aparato no puede pasar de 24 horas en un día' using errcode = 'check_violation';
  end if;
  return new;
end $$;

-- Estado del periodo: extendido si el fin estimado ya pasó sin factura (se calcula al leer, no se guarda).
create view public.periodo_actual with (security_invoker = true) as
select p.id, p.inicio, p.fin_estimado, p.porcentaje, p.meta_kwh, p.factura_base_id, p.meta_modificada,
  case when (now() at time zone 'America/Bogota')::date > p.fin_estimado then 'extendido' else 'abierto' end as estado
from public.periodos p where p.estado <> 'cerrado';
revoke all on public.periodo_actual from anon, authenticated;
grant select on public.periodo_actual to authenticated;
