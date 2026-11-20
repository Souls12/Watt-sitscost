-- Escenarios de la lógica de base de datos más delicada (sin Docker).
-- Ejecutar contra el proyecto remoto (MCP execute_sql o psql): todo corre dentro de una transacción
-- que termina en ROLLBACK, así que no deja datos. Un assert fallido aborta con su mensaje.
-- Supone la ciudad 34 y la empresa 1 aprobadas (semilla). Usuarios de prueba: uuid ...0001 a ...0006.
begin;

create function pg_temp.falla(q text) returns boolean language plpgsql as $$
begin execute q; return false; exception when others then return true; end $$;

create function pg_temp.uid(n int) returns uuid language sql as $$
  select ('00000000-0000-0000-0000-0000000000' || lpad(n::text, 2, '0'))::uuid $$;

create function pg_temp.como(n int) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', pg_temp.uid(n), 'role', 'authenticated')::text, true) $$;

-- Usuarios 1 a 5 con perfil (ciudad 34, empresa 1, estrato 3). El 2 es administrador.
insert into auth.users (id, email, raw_user_meta_data)
select pg_temp.uid(n), 'prueba' || n || '@escenarios.test',
  jsonb_build_object('nombre', 'Prueba ' || n, 'estrato', 3, 'ciudad_id', 34, 'empresa_id', 1, 'tarifa_kwh', '650.5')
from generate_series(1, 5) n;
update public.perfiles set rol = 'administrador' where id = pg_temp.uid(2);

-- 1. Facturas: futuro, periodo larguísimo y año mal escrito se rechazan; una normal pasa.
do $$
declare hoy date := (now() at time zone 'America/Bogota')::date; u uuid := pg_temp.uid(1);
begin
  assert pg_temp.falla(format('insert into public.facturas (usuario_id,kwh_facturado,inicio,fin) values (%L,100,%L,%L)', u, hoy - 5, hoy + 1)), 'factura futura aceptada';
  assert pg_temp.falla(format('insert into public.facturas (usuario_id,kwh_facturado,inicio,fin) values (%L,100,%L,%L)', u, hoy - 150, hoy - 10)), 'factura de 140 dias aceptada';
  assert pg_temp.falla(format('insert into public.facturas (usuario_id,kwh_facturado,inicio,fin) values (%L,100,%L,%L)', u, hoy - 500, hoy - 470)), 'factura de hace 500 dias aceptada';
  assert not pg_temp.falla(format('insert into public.facturas (usuario_id,kwh_facturado,inicio,fin) values (%L,100,%L,%L)', u, hoy - 300, hoy - 271)), 'factura normal rechazada';
  delete from public.facturas where usuario_id = u;
end $$;

-- 2. Cierre de periodo, recalculo de la base, periodo cerrado protegido, borrados y reapertura.
do $$
declare
  hoy date := (now() at time zone 'America/Bogota')::date; u uuid := pg_temp.uid(1);
  b1 bigint; b2 bigint; ap bigint; per public.periodos;
begin
  insert into public.facturas (usuario_id, kwh_facturado, inicio, fin) values (u, 300, hoy - 60, hoy - 31) returning id into b1;
  insert into public.periodos (usuario_id, factura_base_id, porcentaje) values (u, b1, 10);
  select * into per from public.periodos where usuario_id = u;
  assert per.inicio = hoy - 30 and per.meta_kwh = 270, 'periodo mal calculado';

  insert into public.aparatos (usuario_id, nombre, tipo, potencia_w, cantidad) values (u, 'Prueba', 'Otro', 1000, 1) returning id into ap;
  insert into public.registros_uso (usuario_id, aparato_id, fecha, horas) values (u, ap, hoy - 20, 2);

  -- Recalculo de la base mientras el periodo esta abierto.
  update public.facturas set kwh_facturado = 400 where id = b1;
  select * into per from public.periodos where usuario_id = u;
  assert per.meta_kwh = 360, 'recalcular_periodo_base no actualizo la meta abierta';

  -- Cierre al registrar la factura siguiente.
  insert into public.facturas (usuario_id, kwh_facturado, inicio, fin) values (u, 350, hoy - 30, hoy - 1) returning id into b2;
  select * into per from public.periodos where usuario_id = u;
  assert per.estado = 'cerrado' and per.fin_real = hoy - 1 and per.consumo_calculado_cierre = 2, 'sincronizar_cierre no cerro con el consumo correcto';

  -- Periodo cerrado: el uso y la meta no cambian.
  assert pg_temp.falla(format('insert into public.registros_uso (usuario_id,aparato_id,fecha,horas) values (%L,%s,%L,1)', u, ap, hoy - 19)), 'insert en periodo cerrado aceptado';
  assert pg_temp.falla(format('update public.registros_uso set horas = 3 where aparato_id = %s', ap)), 'update en periodo cerrado aceptado';
  assert pg_temp.falla(format('delete from public.registros_uso where aparato_id = %s', ap)), 'delete en periodo cerrado aceptado';
  update public.facturas set kwh_facturado = 500 where id = b1;
  assert (select meta_kwh from public.periodos where id = per.id) = 360, 'recalcular_periodo_base toco un periodo cerrado';

  -- Hallazgo 6: la factura de cierre no puede moverse antes de la base.
  assert pg_temp.falla(format('update public.facturas set inicio = %L, fin = %L where id = %s', hoy - 200, hoy - 100, b2)), 'cierre movido antes de la base';
  -- Hallazgo 2: la base de un periodo cerrado no se puede borrar.
  assert pg_temp.falla(format('delete from public.facturas where id = %s', b1)), 'base de periodo cerrado borrada';
  assert exists (select 1 from public.periodos where id = per.id and estado = 'cerrado'), 'el periodo cerrado desaparecio';

  -- Borrar la factura de cierre reabre el periodo y libera el uso.
  delete from public.facturas where id = b2;
  select * into per from public.periodos where usuario_id = u;
  assert per.estado <> 'cerrado' and per.fin_real is null and per.factura_cierre_id is null, 'reabrir_periodo no reabrio';
  update public.registros_uso set horas = 3 where aparato_id = ap;
end $$;

-- 3. Uso constante automatico: ultimos 3 dias, sin duplicar, respetando periodos.
do $$
declare
  hoy date := (now() at time zone 'America/Bogota')::date;
  u uuid := pg_temp.uid(3); ap bigint; ap_cerrado bigint; n int;
begin
  insert into public.aparatos (usuario_id, nombre, tipo, potencia_w, cantidad, uso_tipico_horas, uso_constante, creado_en)
  values (u, 'Nevera', 'Otro', 100, 1, 3, true, now() - interval '10 days') returning id into ap;
  insert into public.registros_uso (usuario_id, aparato_id, fecha, horas, origen) values (u, ap, hoy - 2, 1, 'manual');
  perform private.registrar_uso_constante();
  select count(*) into n from public.registros_uso where aparato_id = ap;
  assert n = 3, format('esperaba 3 registros (1 manual + 2 automaticos), hay %s', n);
  assert (select horas from public.registros_uso where aparato_id = ap and fecha = hoy - 2) = 1, 'piso el registro manual';
  perform private.registrar_uso_constante();
  assert (select count(*) from public.registros_uso where aparato_id = ap) = 3, 'registro automatico duplicado';

  -- Usuario 1 (escenario 2) tiene un periodo abierto desde hoy-30: no se afecta por un aparato nuevo sin historia.
  insert into public.aparatos (usuario_id, nombre, tipo, potencia_w, cantidad, uso_tipico_horas, uso_constante, creado_en)
  values (u, 'Archivada hoy', 'Otro', 100, 1, 3, true, now()) returning id into ap_cerrado;
  perform private.registrar_uso_constante();
  assert (select count(*) from public.registros_uso where aparato_id = ap_cerrado) = 0, 'registro previo a la creacion del aparato';
end $$;

-- 4. Tarifa compartida: versiones, avisos en es-CO y solo la ultima aprobada se adopta.
do $$
declare v1 bigint; v2 bigint; v3 bigint; aviso text;
begin
  perform pg_temp.como(1); v1 := public.compartir_tarifa(650.5);
  perform pg_temp.como(2); perform public.resolver_propuesta((select id from public.propuestas where tarifa_version_id = v1), 'aprobada');
  perform pg_temp.como(3); perform public.elegir_tarifa(v1);
  assert public.tarifa_vigente(pg_temp.uid(3)) = 650.50, 'no adopto v1';

  perform pg_temp.como(1); v2 := public.compartir_tarifa(1050);
  perform pg_temp.como(2); perform public.resolver_propuesta((select id from public.propuestas where tarifa_version_id = v2), 'aprobada');
  select cuerpo into aviso from public.avisos where usuario_id = pg_temp.uid(3) and tipo = 'tarifa_nueva';
  assert aviso like '%de $651 a $1.050 por kWh%', 'aviso sin formato es-CO: ' || coalesce(aviso, 'null');

  perform pg_temp.como(1); v3 := public.compartir_tarifa(1200);
  perform pg_temp.como(2); perform public.resolver_propuesta((select id from public.propuestas where tarifa_version_id = v3), 'aprobada');
  perform pg_temp.como(3);
  assert pg_temp.falla(format('select public.elegir_tarifa(%s)', v2)), 'adopto una version antigua (v2) existiendo v3';
  perform public.elegir_tarifa(v3);
  assert public.tarifa_vigente(pg_temp.uid(3)) = 1200, 'no adopto v3';
  -- Un usuario normal no resuelve propuestas.
  assert pg_temp.falla(format('select public.resolver_propuesta(%s, %L)', (select id from public.propuestas where tarifa_version_id = v3), 'rechazada')), 'no admin resolvio';
end $$;

-- 5. Registro: una ciudad/empresa propuesta repetida se reutiliza, no se duplica.
do $$
declare c int; e int; u4 uuid := ('00000000-0000-0000-0000-0000000000' || '11')::uuid;
begin
  insert into auth.users (id, email, raw_user_meta_data) values (u4, 'prueba11@escenarios.test',
    '{"nombre":"A","estrato":3,"ciudad_propuesta":"Ciudad Inventada","empresa_propuesta":"Empresa Inventada","tarifa_kwh":"500"}');
  insert into auth.users (id, email, raw_user_meta_data) values (('00000000-0000-0000-0000-0000000000' || '12')::uuid, 'prueba12@escenarios.test',
    '{"nombre":"B","estrato":3,"ciudad_propuesta":"CIUDÁD inventada ","empresa_propuesta":"empresa inventada","tarifa_kwh":"500"}');
  select count(*) into c from public.ciudades where translate(lower(nombre), 'á', 'a') = 'ciudad inventada';
  select count(*) into e from public.empresas where lower(nombre) = 'empresa inventada';
  assert c = 1 and e = 1, format('propuestas duplicadas: %s ciudades, %s empresas', c, e);
  insert into auth.users (id, email, raw_user_meta_data) values (('00000000-0000-0000-0000-0000000000' || '13')::uuid, 'prueba13@escenarios.test',
    jsonb_build_object('nombre', 'C', 'estrato', 3, 'ciudad_propuesta', upper((select nombre from public.ciudades where id = 34)), 'empresa_id', 1));
  assert (select ciudad_id from public.perfiles where id = ('00000000-0000-0000-0000-0000000000' || '13')::uuid) = 34, 'no reutilizo la ciudad aprobada';
end $$;

-- 6. Periodo que empieza manana: los dias restantes no cuentan hoy.
set local role authenticated;
select pg_temp.como(4);
do $$
declare hoy date := (now() at time zone 'America/Bogota')::date; b bigint; r record;
begin
  insert into public.facturas (kwh_facturado, inicio, fin) values (310, hoy - 30, hoy) returning id into b;
  insert into public.periodos (factura_base_id, porcentaje) values (b, 10);
  select * into r from public.panel_hoy;
  assert r.inicio = hoy + 1 and r.fin_estimado = hoy + 31, 'periodo mal armado';
  assert r.dias_restantes = 31, format('dias_restantes = %s, esperaba 31', r.dias_restantes);
  assert r.presupuesto_dia = 9.000, format('presupuesto_dia = %s, esperaba 9.000', r.presupuesto_dia);
end $$;
reset role;

rollback;
