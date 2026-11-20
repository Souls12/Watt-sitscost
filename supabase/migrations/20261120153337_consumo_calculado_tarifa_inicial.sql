-- Antes de la primera tarifa registrada (uso de días previos al alta) se usa la primera tarifa en vez de costo 0.
create or replace view public.consumo_calculado with (security_invoker = true) as
select r.id, r.usuario_id, r.aparato_id, r.fecha, r.horas, r.origen,
  round(a.potencia_w * a.cantidad * r.horas / 1000, 3) as kwh,
  round(a.potencia_w * a.cantidad * r.horas / 1000 * coalesce(
    public.tarifa_vigente(r.usuario_id, r.fecha),
    (select t.valor_kwh from public.tarifas_usuario t where t.usuario_id = r.usuario_id order by t.desde, t.id limit 1),
    0), 2) as costo
from public.registros_uso r join public.aparatos a on a.id = r.aparato_id;
