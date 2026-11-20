-- Semanas hasta hoy: el presupuesto de días futuros no es un dato (su fórmula supone consumo cero), así que no se listan.
-- parcial = la semana lunes-domingo se recorta por el inicio o el fin del periodo (no por hoy).
create or replace function public.semanas_periodo()
returns table (semana date, desde date, hasta date, kwh numeric, presupuesto numeric, parcial boolean, es_actual boolean)
language sql stable security invoker set search_path = ''
as $$
  with h as (select (now() at time zone 'America/Bogota')::date as hoy),
  p as (select inicio, greatest(fin_estimado, h.hoy) as fin, h.hoy from public.periodo_actual, h),
  d as (
    select g::date as fecha, date_trunc('week', g)::date as semana, public.presupuesto_dia(g::date) as presupuesto
    from p, generate_series(p.inicio, p.hoy, interval '1 day') g
  ),
  k as (select c.fecha, sum(c.kwh) as kwh from public.consumo_calculado c group by c.fecha)
  select d.semana, greatest(d.semana, (select inicio from p)), least(d.semana + 6, (select fin from p)),
    coalesce(sum(k.kwh), 0), round(sum(d.presupuesto), 3),
    d.semana < (select inicio from p) or d.semana + 6 > (select fin from p),
    d.semana = date_trunc('week', (select hoy from p))::date
  from d left join k on k.fecha = d.fecha
  group by d.semana order by d.semana
$$;
