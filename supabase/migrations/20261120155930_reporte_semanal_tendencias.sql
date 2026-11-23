-- Reporte semanal (ticket 11): semanas de lunes a domingo del periodo actual; las de los bordes quedan recortadas (parcial).
-- El presupuesto semanal es la suma de presupuesto_dia() de sus días (la fórmula vive solo en esa función).
create function public.semanas_periodo()
returns table (semana date, desde date, hasta date, kwh numeric, presupuesto numeric, parcial boolean, es_actual boolean)
language sql stable security invoker set search_path = ''
as $$
  with h as (select (now() at time zone 'America/Bogota')::date as hoy),
  p as (select inicio, greatest(fin_estimado, h.hoy) as fin, h.hoy from public.periodo_actual, h),
  d as (
    select g::date as fecha, date_trunc('week', g)::date as semana, public.presupuesto_dia(g::date) as presupuesto
    from p, generate_series(p.inicio, p.fin, interval '1 day') g
  ),
  k as (select c.fecha, sum(c.kwh) as kwh from public.consumo_calculado c group by c.fecha)
  select d.semana, min(d.fecha), max(d.fecha), coalesce(sum(k.kwh), 0), round(sum(d.presupuesto), 3),
    min(d.fecha) > d.semana or max(d.fecha) < d.semana + 6,
    d.semana = date_trunc('week', (select hoy from p))::date
  from d left join k on k.fecha = d.fecha
  group by d.semana order by d.semana
$$;

-- Consumo por aparato y semana (incluye aparatos archivados: su consumo pasado cuenta).
create function public.tendencia_aparatos()
returns table (semana date, aparato_id bigint, nombre text, tipo text, kwh numeric)
language sql stable security invoker set search_path = ''
as $$
  select date_trunc('week', c.fecha)::date, a.id, a.nombre, a.tipo, sum(c.kwh)
  from public.periodo_actual p
  join public.consumo_calculado c on c.fecha >= p.inicio
  join public.aparatos a on a.id = c.aparato_id
  group by 1, a.id, a.nombre, a.tipo order by 1, a.nombre
$$;
revoke execute on function public.semanas_periodo(), public.tendencia_aparatos() from public, anon;
grant execute on function public.semanas_periodo(), public.tendencia_aparatos() to authenticated;
