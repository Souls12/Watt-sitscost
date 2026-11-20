-- Cierre de periodo (ticket 11). La factura siguiente cierra el periodo abierto; corregirla recalcula; eliminarla lo reabre.
create function private.sincronizar_cierre() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare p public.periodos;
begin
  -- ¿Ya es la factura de cierre de un periodo? Recalcular con sus fechas actuales.
  select * into p from public.periodos where factura_cierre_id = new.id;
  if not found then
    -- Cierra el periodo sin cerrar del usuario si esta factura es posterior a la base.
    select pe.* into p from public.periodos pe join public.facturas b on b.id = pe.factura_base_id
      where pe.usuario_id = new.usuario_id and pe.estado <> 'cerrado' and new.inicio > b.fin;
    if not found then return null; end if;
  end if;
  update public.periodos set estado = 'cerrado', fin_real = new.fin, factura_cierre_id = new.id,
    consumo_calculado_cierre = (select coalesce(sum(c.kwh), 0) from public.consumo_calculado c
      where c.usuario_id = p.usuario_id and c.fecha between p.inicio and new.fin)
  where id = p.id;
  return null;
end $$;
revoke execute on function private.sincronizar_cierre() from public, anon, authenticated;
create trigger sincronizar_cierre after insert or update of inicio, fin on public.facturas
  for each row execute function private.sincronizar_cierre();

-- Eliminar la factura de cierre reabre el periodo; el ciclo nuevo que partía de ella se elimina (queda un solo periodo sin cerrar).
create function private.reabrir_periodo() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if exists (select 1 from public.periodos where factura_cierre_id = old.id) then
    delete from public.periodos where factura_base_id = old.id;
    update public.periodos set estado = 'abierto', fin_real = null, factura_cierre_id = null, consumo_calculado_cierre = null
    where factura_cierre_id = old.id;
  end if;
  return old;
end $$;
revoke execute on function private.reabrir_periodo() from public, anon, authenticated;
create trigger reabrir_periodo before delete on public.facturas
  for each row execute function private.reabrir_periodo();

-- Cierre pendiente de respuesta: último periodo cerrado sin ciclo nuevo. Los porcentajes sugeridos los calcula la base.
create view public.cierre_pendiente with (security_invoker = true) as
select p.id as periodo_id, p.inicio, p.fin_real, p.porcentaje, p.meta_kwh,
  f.kwh_facturado, p.consumo_calculado_cierre as kwh_calculado,
  f.kwh_facturado > p.meta_kwh as meta_superada,
  f.id as factura_cierre_id,
  greatest(1, p.porcentaje - 5) as porcentaje_menos,
  least(99, p.porcentaje + 5) as porcentaje_mas
from public.periodos p join public.facturas f on f.id = p.factura_cierre_id
where p.estado = 'cerrado'
  and not exists (select 1 from public.periodos n where n.factura_base_id = p.factura_cierre_id)
order by p.fin_real desc limit 1;
revoke all on public.cierre_pendiente from anon, authenticated;
grant select on public.cierre_pendiente to authenticated;
