-- Cambiar la meta a mitad del periodo (ticket 10). periodos.porcentaje/meta_kwh siempre guardan la ÚLTIMA meta (el cierre compara con ella);
-- cambios_meta guarda el historial para recalcular el presupuesto de cada día con la meta que regía ese día.
create table public.cambios_meta (
  id bigint generated always as identity primary key,
  periodo_id bigint not null references public.periodos (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  desde date not null,
  porcentaje_anterior numeric(5, 2) not null,
  meta_kwh_anterior numeric(8, 2) not null,
  porcentaje numeric(5, 2) not null,
  meta_kwh numeric(8, 2) not null,
  creado_en timestamptz not null default now()
);
create index on public.cambios_meta (periodo_id);
create index on public.cambios_meta (usuario_id);
alter table public.cambios_meta enable row level security;
revoke all on public.cambios_meta from anon, authenticated;
grant select on public.cambios_meta to authenticated;
create policy "ver mis cambios de meta" on public.cambios_meta for select to authenticated using (usuario_id = (select auth.uid()));

-- Solo por esta función (dueño, validada) se cambia la meta; el periodo queda como 'periodo con meta modificada'.
create function public.cambiar_meta(p_porcentaje numeric) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  p public.periodos;
  v_kwh numeric;
  v_meta numeric;
begin
  if v_uid is null then raise exception 'Sesión requerida' using errcode = 'insufficient_privilege'; end if;
  if p_porcentaje is null or p_porcentaje <= 0 or p_porcentaje >= 100 then
    raise exception 'El porcentaje debe estar entre 0 y 100' using errcode = 'check_violation';
  end if;
  select * into p from public.periodos where usuario_id = v_uid and estado <> 'cerrado' for update;
  if not found then raise exception 'No tienes un periodo abierto' using errcode = 'check_violation'; end if;
  select kwh_facturado into v_kwh from public.facturas where id = p.factura_base_id;
  v_meta := round(v_kwh * (1 - p_porcentaje / 100), 2);
  insert into public.cambios_meta (periodo_id, usuario_id, desde, porcentaje_anterior, meta_kwh_anterior, porcentaje, meta_kwh)
  values (p.id, v_uid, (now() at time zone 'America/Bogota')::date, p.porcentaje, p.meta_kwh, p_porcentaje, v_meta);
  update public.periodos set porcentaje = p_porcentaje, meta_kwh = v_meta, meta_modificada = true where id = p.id;
end $$;
revoke execute on function public.cambiar_meta(numeric) from public, anon;
grant execute on function public.cambiar_meta(numeric) to authenticated;

-- Presupuesto: para cada día D se usa la meta vigente ese día (la anterior al primer cambio posterior a D, o la actual).
create or replace function public.presupuesto_dia(p_fecha date default (now() at time zone 'America/Bogota')::date)
returns numeric
language sql stable security invoker set search_path = ''
as $$
  select greatest(0, (coalesce(
      (select c.meta_kwh_anterior from public.cambios_meta c where c.periodo_id = p.id and c.desde > p_fecha order by c.desde, c.id limit 1),
      p.meta_kwh)
      - coalesce((select sum(k.kwh) from public.consumo_calculado k where k.fecha >= p.inicio and k.fecha < p_fecha), 0))
    / greatest(1, p.fin_estimado - p_fecha + 1))
  from public.periodo_actual p
$$;
