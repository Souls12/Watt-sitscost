-- Correcciones de la auditoría ponytail (hallazgos 1, 2, 3, 5, 6, 9, 11 SQL, 14).

-- 1. Periodos de factura razonables: sin años mal escritos que disparen cálculos por día.
create or replace function private.validar_factura() returns trigger
language plpgsql set search_path = '' as $$
declare hoy date := (now() at time zone 'America/Bogota')::date;
begin
  if new.fin > hoy then
    raise exception 'El periodo de la factura no puede ser futuro' using errcode = 'check_violation';
  end if;
  if tg_op = 'INSERT' or new.inicio is distinct from old.inicio or new.fin is distinct from old.fin then
    if new.fin - new.inicio > 100 then
      raise exception 'El periodo de la factura es demasiado largo' using errcode = 'check_violation';
    end if;
    if new.inicio < hoy - 400 then
      raise exception 'El periodo de la factura es demasiado antiguo' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;

-- 2. No borrar una factura que es la base de un periodo cerrado (la cascada lo borraría).
create or replace function private.proteger_base_cerrada() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Al borrar la cuenta, la cascada elimina las facturas: se permite.
  if not exists (select 1 from auth.users where id = old.usuario_id) then return old; end if;
  if exists (select 1 from public.periodos where factura_base_id = old.id and estado = 'cerrado') then
    raise exception 'Esta factura es la base de un periodo cerrado y no se puede eliminar' using errcode = 'check_violation';
  end if;
  return old;
end $$;
revoke execute on function private.proteger_base_cerrada() from public, anon, authenticated;
create trigger a_proteger_base_cerrada before delete on public.facturas
  for each row execute function private.proteger_base_cerrada();

-- 3. Solo se puede adoptar la última versión aprobada de una tarifa.
create or replace function private.enlazar_tarifa(p_version bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  t public.tarifas_compartidas;
begin
  select c.* into t from public.tarifas_compartidas c
  join public.perfiles p on p.id = v_uid and p.ciudad_id = c.ciudad_id and p.estrato = c.estrato and p.empresa_id = c.empresa_id
  where c.id = p_version and c.estado = 'aprobada'
    and c.id = (select max(m.id) from public.tarifas_compartidas m where m.tarifa_id = c.tarifa_id and m.estado = 'aprobada');
  if not found then raise exception 'Esa tarifa no está disponible para ti'; end if;
  insert into public.tarifas_usuario (usuario_id, valor_kwh, tarifa_compartida_version_id)
  values (v_uid, t.valor_kwh, t.id);
end $$;

-- 5. Un registro no crea ciudades/empresas propuestas duplicadas: reutiliza la existente.
create or replace function private.crear_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_ciudad bigint;
  v_empresa bigint;
  v_nombre text;
begin
  v_nombre := nullif(trim(m ->> 'ciudad_propuesta'), '');
  if v_nombre is not null then
    select id into v_ciudad from public.ciudades
    where estado in ('aprobada', 'propuesta')
      and translate(lower(nombre), 'áéíóúü', 'aeiouu') = translate(lower(v_nombre), 'áéíóúü', 'aeiouu')
    order by (estado = 'aprobada') desc, id limit 1;
    if v_ciudad is null then
      insert into public.ciudades (nombre, departamento, estado, propuesta_por)
      values (v_nombre, nullif(trim(m ->> 'departamento_propuesto'), ''), 'propuesta', new.id)
      returning id into v_ciudad;
    end if;
  else
    select id into v_ciudad from public.ciudades
    where id = (m ->> 'ciudad_id')::bigint and estado = 'aprobada';
  end if;

  v_nombre := nullif(trim(m ->> 'empresa_propuesta'), '');
  if v_nombre is not null then
    select id into v_empresa from public.empresas
    where estado in ('aprobada', 'propuesta')
      and translate(lower(nombre), 'áéíóúü', 'aeiouu') = translate(lower(v_nombre), 'áéíóúü', 'aeiouu')
    order by (estado = 'aprobada') desc, id limit 1;
    if v_empresa is null then
      insert into public.empresas (nombre, estado, propuesta_por)
      values (v_nombre, 'propuesta', new.id)
      returning id into v_empresa;
    end if;
  else
    select id into v_empresa from public.empresas
    where id = (m ->> 'empresa_id')::bigint and estado = 'aprobada';
  end if;

  if v_ciudad is null or v_empresa is null then
    raise exception 'Ciudad o empresa no válida';
  end if;

  insert into public.perfiles (id, nombre, ciudad_id, estrato, empresa_id)
  values (new.id, trim(m ->> 'nombre'), v_ciudad, (m ->> 'estrato')::smallint, v_empresa);
  return new;
end;
$$;

-- 6. Editar la factura de cierre a fechas anteriores a la base se rechaza (el periodo cerrado no cambia).
create or replace function private.sincronizar_cierre() returns trigger
language plpgsql security definer set search_path = '' as $$
declare p public.periodos;
begin
  select * into p from public.periodos where factura_cierre_id = new.id;
  if found then
    if new.inicio <= (select b.fin from public.facturas b where b.id = p.factura_base_id) then
      raise exception 'La factura de cierre no puede empezar antes del fin de la factura base' using errcode = 'check_violation';
    end if;
  else
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

-- 9. El registro automático cubre los últimos 3 días (si un día falla, se recupera) sin pisar reglas de periodo.
create or replace function private.registrar_uso_constante() returns void
language sql security definer set search_path = '' as $$
  insert into public.registros_uso (usuario_id, aparato_id, fecha, horas, origen)
  select a.usuario_id, a.id, d.dia, a.uso_tipico_horas, 'automatico'
  from public.aparatos a
  cross join lateral (select ((now() at time zone 'America/Bogota')::date - n) as dia from generate_series(1, 3) n) d
  where a.uso_constante and a.archivado_en is null and a.uso_tipico_horas is not null
    and d.dia >= (a.creado_en at time zone 'America/Bogota')::date
    and not exists (select 1 from public.registros_uso r where r.aparato_id = a.id and r.fecha = d.dia)
    and not exists (select 1 from public.periodos p
      where p.usuario_id = a.usuario_id
        and ((p.estado <> 'cerrado' and p.inicio > d.dia)
          or (p.estado = 'cerrado' and d.dia between p.inicio and p.fin_real)))
$$;

-- 11. Pesos en es-CO (miles con punto, sin decimales) en los avisos escritos por la base.
create or replace function private.formato_pesos(v numeric) returns text
language sql immutable set search_path = '' as $$
  select replace(to_char(round(v), 'FM999,999,999,999'), ',', '.')
$$;

create or replace function private.resolver_propuesta(p_id bigint, p_decision text, p_nota text default null, p_unir_con bigint default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  p public.propuestas;
  t public.tarifas_compartidas;
  v_nombre text;
  v_existente text;
  v_nota text := nullif(trim(p_nota), '');
  v_cuerpo text;
begin
  if not private.es_administrador() then
    raise exception 'Solo el administrador puede revisar propuestas' using errcode = '42501';
  end if;
  if p_decision is null or p_decision not in ('aprobada', 'rechazada', 'pospuesta', 'unida') then
    raise exception 'Decisión no válida';
  end if;
  select * into p from public.propuestas where id = p_id and estado in ('pendiente', 'pospuesta') for update;
  if not found then
    raise exception 'La propuesta no existe o ya fue resuelta';
  end if;
  if p_decision = 'unida' and (p.tipo not in ('ciudad', 'empresa') or p_unir_con is null) then
    raise exception 'Solo una ciudad o empresa se une con una existente';
  end if;

  if p.tipo = 'aparato' then
    select coalesce(marca || ' ' || modelo, tipo) into v_nombre from public.aparatos_referencia where id = p.aparato_referencia_id;
    if p_decision in ('aprobada', 'rechazada') then
      update public.aparatos_referencia set estado = p_decision, actualizado_en = now() where id = p.aparato_referencia_id;
    end if;
  elsif p.tipo = 'ciudad' then
    select nombre into v_nombre from public.ciudades where id = p.ciudad_id;
    if p_decision = 'unida' then
      select nombre into v_existente from public.ciudades where id = p_unir_con and estado = 'aprobada';
      if v_existente is null then raise exception 'La ciudad existente no es válida'; end if;
      update public.perfiles set ciudad_id = p_unir_con where ciudad_id = p.ciudad_id;
      delete from public.ciudades where id = p.ciudad_id;
    elsif p_decision in ('aprobada', 'rechazada') then
      update public.ciudades set estado = p_decision where id = p.ciudad_id;
    end if;
  elsif p.tipo = 'empresa' then
    select nombre into v_nombre from public.empresas where id = p.empresa_id;
    if p_decision = 'unida' then
      select nombre into v_existente from public.empresas where id = p_unir_con and estado = 'aprobada';
      if v_existente is null then raise exception 'La empresa existente no es válida'; end if;
      update public.perfiles set empresa_id = p_unir_con where empresa_id = p.empresa_id;
      delete from public.empresas where id = p.empresa_id;
    elsif p_decision in ('aprobada', 'rechazada') then
      update public.empresas set estado = p_decision where id = p.empresa_id;
    end if;
  else
    update public.tarifas_compartidas
    set estado = case when p_decision in ('aprobada', 'rechazada') then p_decision else estado end,
        desde = case when p_decision = 'aprobada' then (now() at time zone 'America/Bogota')::date else desde end
    where id = p.tarifa_version_id
    returning * into t;
    v_nombre := format('Tu tarifa de $%s por kWh', private.formato_pesos(t.valor_kwh));
    if p_decision = 'aprobada' then
      insert into public.avisos (usuario_id, tipo, titulo, cuerpo, propuesta_id, tarifa_version_id)
      select u.usuario_id, 'tarifa_nueva', 'Cambió una tarifa compartida',
        format('La tarifa que sigues pasó de $%s a $%s por kWh. Tu tarifa vigente no cambia hasta que decidas adoptarla.',
          private.formato_pesos(o.valor_kwh), private.formato_pesos(t.valor_kwh)),
        p.id, t.id
      from (select distinct on (usuario_id) usuario_id, tarifa_compartida_version_id
            from public.tarifas_usuario order by usuario_id, desde desc, id desc) u
      join public.tarifas_compartidas o on o.id = u.tarifa_compartida_version_id and o.tarifa_id = t.tarifa_id and o.id < t.id
      where u.usuario_id <> t.autor_id;
    end if;
  end if;

  update public.propuestas
  set estado = p_decision, nota = v_nota, decidido_por = (select auth.uid()), decidido_en = now()
  where id = p_id;

  if p_decision = 'pospuesta' or p.propuesto_por is null then
    return;
  end if;
  v_cuerpo := case p_decision
    when 'aprobada' then format('«%s» ya está disponible para todos.', v_nombre)
    when 'rechazada' then format('«%s» no se agregó. Puedes seguir usándolo como hasta ahora.', v_nombre)
    else format('«%s» ya existía como «%s». Actualizamos tu perfil.', v_nombre, v_existente)
  end || coalesce(E'\n' || v_nota, '');
  insert into public.avisos (usuario_id, tipo, titulo, cuerpo, propuesta_id)
  values (p.propuesto_por, 'propuesta_resuelta',
    case when p_decision = 'aprobada' then 'Aprobamos tu propuesta' else 'Revisamos tu propuesta' end,
    v_cuerpo, p.id);
end;
$$;
revoke execute on function private.formato_pesos(numeric) from public, anon;

-- 14. Los días restantes nunca cuentan antes del inicio del periodo.
create or replace function public.presupuesto_dia(p_fecha date default ((now() at time zone 'America/Bogota'))::date)
returns numeric language sql stable set search_path = '' as $$
  select greatest(0, (coalesce(
      (select c.meta_kwh_anterior from public.cambios_meta c where c.periodo_id = p.id and c.desde > p_fecha order by c.desde, c.id limit 1),
      p.meta_kwh)
      - coalesce((select sum(k.kwh) from public.consumo_calculado k where k.fecha >= p.inicio and k.fecha < p_fecha), 0))
    / greatest(1, p.fin_estimado - greatest(p_fecha, p.inicio) + 1))
  from public.periodo_actual p
$$;

create or replace view public.panel_hoy as
 WITH h AS (
         SELECT ((now() AT TIME ZONE 'America/Bogota'::text))::date AS hoy
        ), c AS (
         SELECT p.id, p.inicio, p.fin_estimado, p.porcentaje, p.meta_kwh, p.factura_base_id, p.meta_modificada, p.estado, h.hoy,
            COALESCE(( SELECT sum(k.kwh) FROM consumo_calculado k WHERE ((k.fecha >= p.inicio) AND (k.fecha <= h.hoy))), (0)::numeric) AS consumido_periodo,
            COALESCE(( SELECT sum(k.kwh) FROM consumo_calculado k WHERE (k.fecha = h.hoy)), (0)::numeric) AS consumido_hoy,
            presupuesto_dia(h.hoy) AS presupuesto_dia
           FROM periodo_actual p, h
        )
 SELECT id AS periodo_id, estado, inicio, fin_estimado, meta_kwh, hoy, consumido_periodo, consumido_hoy,
    round(presupuesto_dia, 3) AS presupuesto_dia,
    round(CASE WHEN (consumido_periodo >= meta_kwh) THEN (0)::numeric ELSE GREATEST((0)::numeric, (presupuesto_dia - consumido_hoy)) END, 3) AS presupuesto_hoy,
    GREATEST((0)::numeric, (consumido_periodo - meta_kwh)) AS excedente,
    (consumido_periodo >= meta_kwh) AS meta_alcanzada,
    GREATEST(0, ((fin_estimado - GREATEST(hoy, inicio)) + 1)) AS dias_restantes,
    COALESCE(tarifa_vigente(auth.uid(), hoy), (0)::numeric) AS tarifa_kwh,
    racha_dias() AS racha
   FROM c;
