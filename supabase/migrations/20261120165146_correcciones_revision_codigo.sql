-- Correcciones de revisión de código (spec #1).

-- 1) El cron nocturno omite filas que el validador rechazaría (periodo que empieza hoy, periodo cerrado) en vez de abortar para todos.
create or replace function private.registrar_uso_constante() returns void
language sql security definer set search_path = ''
as $$
  insert into public.registros_uso (usuario_id, aparato_id, fecha, horas, origen)
  select a.usuario_id, a.id, ((now() at time zone 'America/Bogota')::date - 1), a.uso_tipico_horas, 'automatico'
  from public.aparatos a
  where a.uso_constante and a.archivado_en is null and a.uso_tipico_horas is not null
    and not exists (select 1 from public.registros_uso r
      where r.aparato_id = a.id and r.fecha = ((now() at time zone 'America/Bogota')::date - 1))
    and not exists (select 1 from public.periodos p
      where p.usuario_id = a.usuario_id
        and ((p.estado <> 'cerrado' and p.inicio > ((now() at time zone 'America/Bogota')::date - 1))
          or (p.estado = 'cerrado' and ((now() at time zone 'America/Bogota')::date - 1) between p.inicio and p.fin_real)))
$$;

-- 4) El uso dentro de un periodo cerrado no se inserta, edita ni borra (la propagación de potencia ya lo salta).
create function private.proteger_periodo_cerrado() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  -- Al borrar la cuenta, la cascada elimina los registros: se permite.
  if tg_op = 'DELETE' and not exists (select 1 from auth.users where id = old.usuario_id) then return old; end if;
  if exists (select 1 from public.periodos p where p.estado = 'cerrado'
      and ((tg_op <> 'INSERT' and p.usuario_id = old.usuario_id and old.fecha between p.inicio and p.fin_real)
        or (tg_op <> 'DELETE' and p.usuario_id = new.usuario_id and new.fecha between p.inicio and p.fin_real))) then
    raise exception 'No se puede modificar el uso de un periodo cerrado' using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end $$;
revoke execute on function private.proteger_periodo_cerrado() from public, anon, authenticated;
create trigger proteger_periodo_cerrado before insert or update or delete on public.registros_uso
  for each row execute function private.proteger_periodo_cerrado();

-- 3) Editar la factura base recalcula el periodo abierto que nació de ella y su historial de metas.
create function private.recalcular_periodo_base() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.periodos set inicio = new.fin + 1, fin_estimado = new.fin + (new.fin - new.inicio + 1),
    meta_kwh = round(new.kwh_facturado * (1 - porcentaje / 100), 2)
  where factura_base_id = new.id and estado <> 'cerrado';
  update public.cambios_meta c
  set meta_kwh = round(new.kwh_facturado * (1 - c.porcentaje / 100), 2),
      meta_kwh_anterior = round(new.kwh_facturado * (1 - c.porcentaje_anterior / 100), 2)
  where c.periodo_id in (select id from public.periodos where factura_base_id = new.id and estado <> 'cerrado');
  return null;
end $$;
revoke execute on function private.recalcular_periodo_base() from public, anon, authenticated;
create trigger recalcular_periodo_base after update of kwh_facturado, inicio, fin on public.facturas
  for each row execute function private.recalcular_periodo_base();

-- 5) El perfil solo apunta a ciudades/empresas aprobadas o propuestas por el mismo usuario.
create function private.validar_ubicacion_perfil() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.ciudad_id is distinct from old.ciudad_id and not exists (
    select 1 from public.ciudades where id = new.ciudad_id and (estado = 'aprobada' or propuesta_por = new.id)) then
    raise exception 'Ciudad no válida' using errcode = 'check_violation';
  end if;
  if new.empresa_id is distinct from old.empresa_id and not exists (
    select 1 from public.empresas where id = new.empresa_id and (estado = 'aprobada' or propuesta_por = new.id)) then
    raise exception 'Empresa no válida' using errcode = 'check_violation';
  end if;
  return new;
end $$;
revoke execute on function private.validar_ubicacion_perfil() from public, anon, authenticated;
create trigger validar_ubicacion_perfil before update on public.perfiles
  for each row execute function private.validar_ubicacion_perfil();

-- 7) El cierre queda respondido cuando existe un periodo posterior (no solo uno basado en la factura de cierre).
create or replace view public.cierre_pendiente with (security_invoker = true) as
select p.id as periodo_id, p.inicio, p.fin_real, p.porcentaje, p.meta_kwh,
  f.kwh_facturado, p.consumo_calculado_cierre as kwh_calculado,
  f.kwh_facturado > p.meta_kwh as meta_superada,
  f.id as factura_cierre_id,
  greatest(1, p.porcentaje - 5) as porcentaje_menos,
  least(99, p.porcentaje + 5) as porcentaje_mas
from public.periodos p join public.facturas f on f.id = p.factura_cierre_id
where p.estado = 'cerrado'
  and not exists (select 1 from public.periodos n
    where n.usuario_id = p.usuario_id and (n.factura_base_id = p.factura_cierre_id or n.inicio > p.fin_real))
order by p.fin_real desc limit 1;

-- 9) Mensaje claro si el aparato ya existe aprobado en el catálogo.
create or replace function private.proponer_aparato(p_aparato bigint, p_marca text, p_modelo text) returns bigint
language plpgsql security definer set search_path = ''
as $$
declare
  a public.aparatos;
  v_ref bigint;
begin
  select * into a from public.aparatos
  where id = p_aparato and usuario_id = (select auth.uid()) and archivado_en is null;
  if not found then
    raise exception 'Aparato no encontrado';
  end if;
  if nullif(trim(p_marca), '') is null or nullif(trim(p_modelo), '') is null then
    raise exception 'Escribe la marca y el modelo';
  end if;
  if exists (select 1 from public.aparatos_referencia where id = a.referencia_id and estado in ('aprobada', 'propuesta')) then
    raise exception 'Este aparato ya está en el catálogo o en revisión';
  end if;
  if exists (select 1 from public.aparatos_referencia
      where estado = 'aprobada' and tipo = a.tipo and coalesce(marca, '') = trim(p_marca) and coalesce(modelo, '') = trim(p_modelo)) then
    raise exception 'Ese aparato ya está en el catálogo: búscalo allí';
  end if;

  insert into public.aparatos_referencia (tipo, marca, modelo, potencia_w, criterio_potencia, fuente, estado, propuesto_por)
  values (a.tipo, trim(p_marca), trim(p_modelo), a.potencia_w, 'nominal', 'Etiqueta del aparato (propuesta de un usuario)', 'propuesta', a.usuario_id)
  returning id into v_ref;
  update public.aparatos set referencia_id = v_ref where id = a.id;
  return v_ref;
end;
$$;
