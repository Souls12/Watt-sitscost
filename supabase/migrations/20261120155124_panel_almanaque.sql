-- Panel del almanaque (ticket 9). Fórmula del presupuesto diario en UN solo lugar: public.presupuesto_dia(fecha).
-- presupuesto del día D = (meta - consumido antes de D) / días restantes desde D (incluido D; mínimo 1 si el periodo se extendió), nunca negativo.
-- El ticket 10 la extiende aquí (meta cambiada a mitad de periodo).
create function public.presupuesto_dia(p_fecha date default (now() at time zone 'America/Bogota')::date)
returns numeric
language sql stable security invoker set search_path = ''
as $$
  select greatest(0, (p.meta_kwh - coalesce((
      select sum(c.kwh) from public.consumo_calculado c where c.fecha >= p.inicio and c.fecha < p_fecha), 0))
    / greatest(1, p.fin_estimado - p_fecha + 1))
  from public.periodo_actual p
$$;

-- Panel de hoy: una fila si hay periodo sin cerrar; ninguna si no.
create view public.panel_hoy with (security_invoker = true) as
with h as (select (now() at time zone 'America/Bogota')::date as hoy),
c as (
  select p.*, h.hoy,
    coalesce((select sum(k.kwh) from public.consumo_calculado k where k.fecha >= p.inicio and k.fecha <= h.hoy), 0) as consumido_periodo,
    coalesce((select sum(k.kwh) from public.consumo_calculado k where k.fecha = h.hoy), 0) as consumido_hoy,
    public.presupuesto_dia(h.hoy) as presupuesto_dia
  from public.periodo_actual p, h
)
select c.id as periodo_id, c.estado, c.inicio, c.fin_estimado, c.meta_kwh, c.hoy,
  c.consumido_periodo, c.consumido_hoy,
  round(c.presupuesto_dia, 3) as presupuesto_dia,
  round(case when c.consumido_periodo >= c.meta_kwh then 0 else greatest(0, c.presupuesto_dia - c.consumido_hoy) end, 3) as presupuesto_hoy,
  greatest(0, c.consumido_periodo - c.meta_kwh) as excedente,
  c.consumido_periodo >= c.meta_kwh as meta_alcanzada,
  greatest(0, c.fin_estimado - c.hoy + 1) as dias_restantes,
  coalesce(public.tarifa_vigente(auth.uid(), c.hoy), 0) as tarifa_kwh,
  public.racha_dias() as racha
from c;
revoke all on public.panel_hoy from anon, authenticated;
grant select on public.panel_hoy to authenticated;

-- Almanaque: un renglón por día, de inicio a max(fin estimado, hoy). fraccion = gastado / presupuesto del día (sin tope; 1 si el presupuesto es 0 y hubo gasto).
create function public.almanaque_periodo()
returns table (fecha date, kwh numeric, presupuesto numeric, fraccion numeric, reportado boolean, es_hoy boolean)
language sql stable security invoker set search_path = ''
as $$
  with h as (select (now() at time zone 'America/Bogota')::date as hoy),
  d as (
    select g::date as fecha, public.presupuesto_dia(g::date) as presupuesto
    from public.periodo_actual p, h, generate_series(p.inicio, greatest(p.fin_estimado, h.hoy), interval '1 day') g
  ),
  k as (select c.fecha, sum(c.kwh) as kwh from public.consumo_calculado c group by c.fecha),
  r as (select distinct u.fecha from public.registros_uso u where u.origen = 'manual')
  select d.fecha, coalesce(k.kwh, 0), round(d.presupuesto, 3),
    case when coalesce(k.kwh, 0) = 0 then 0 when d.presupuesto = 0 then 1 else round(k.kwh / d.presupuesto, 3) end,
    r.fecha is not null, d.fecha = h.hoy
  from d cross join h left join k on k.fecha = d.fecha left join r on r.fecha = d.fecha
  order by d.fecha
$$;
revoke execute on function public.presupuesto_dia(date), public.almanaque_periodo() from public, anon;
grant execute on function public.presupuesto_dia(date), public.almanaque_periodo() to authenticated;
