-- Ticket #13: propuestas (aparato, ciudad, empresa), revisión del administrador y bandeja de avisos.
-- El ticket #14 agrega el tipo 'tarifa': amplía propuestas_tipo_check, una columna tarifa_version_id,
-- una rama en private.resolver_propuesta y el tipo de aviso 'tarifa_nueva' en avisos_tipo_check.

-- Una ciudad o empresa propuesta puede rechazarse (sigue ligada al perfil de quien la propuso).
alter table public.ciudades drop constraint ciudades_estado_check,
  add constraint ciudades_estado_check check (estado in ('aprobada', 'propuesta', 'rechazada'));
alter table public.empresas drop constraint empresas_estado_check,
  add constraint empresas_estado_check check (estado in ('aprobada', 'propuesta', 'rechazada'));

create table public.propuestas (
  id bigint generated always as identity primary key,
  tipo text not null constraint propuestas_tipo_check check (tipo in ('aparato', 'ciudad', 'empresa')),
  propuesto_por uuid references auth.users (id) on delete set null,
  aparato_referencia_id bigint references public.aparatos_referencia (id) on delete cascade,
  -- set null: al unir un duplicado se borra la ciudad o empresa propuesta.
  ciudad_id bigint references public.ciudades (id) on delete set null,
  empresa_id bigint references public.empresas (id) on delete set null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pospuesta', 'aprobada', 'rechazada', 'unida')),
  nota text check (length(nota) <= 500),
  decidido_por uuid references auth.users (id) on delete set null,
  decidido_en timestamptz,
  creado_en timestamptz not null default now(),
  check (num_nonnulls(aparato_referencia_id, ciudad_id, empresa_id) <= 1)
);
create index propuestas_abiertas_idx on public.propuestas (creado_en) where estado in ('pendiente', 'pospuesta');
create index propuestas_propuesto_por_idx on public.propuestas (propuesto_por);
create index propuestas_aparato_referencia_idx on public.propuestas (aparato_referencia_id) where aparato_referencia_id is not null;
create index propuestas_ciudad_idx on public.propuestas (ciudad_id) where ciudad_id is not null;
create index propuestas_empresa_idx on public.propuestas (empresa_id) where empresa_id is not null;
create index propuestas_decidido_por_idx on public.propuestas (decidido_por) where decidido_por is not null;

-- Aviso: mensaje de la bandeja. atendido_en = el usuario ya decidió (p. ej. actualizar o no su copia).
create table public.avisos (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null constraint avisos_tipo_check check (tipo in ('propuesta_resuelta', 'ficha_corregida')),
  titulo text not null,
  cuerpo text not null,
  propuesta_id bigint references public.propuestas (id) on delete cascade,
  aparato_id bigint references public.aparatos (id) on delete cascade,
  referencia_id bigint references public.aparatos_referencia (id) on delete cascade,
  leido_en timestamptz,
  atendido_en timestamptz,
  creado_en timestamptz not null default now()
);
create index avisos_usuario_idx on public.avisos (usuario_id, creado_en desc);
create index avisos_propuesta_idx on public.avisos (propuesta_id) where propuesta_id is not null;
create index avisos_aparato_idx on public.avisos (aparato_id) where aparato_id is not null;
create index avisos_referencia_idx on public.avisos (referencia_id) where referencia_id is not null;

alter table public.propuestas enable row level security;
alter table public.avisos enable row level security;

-- Nadie escribe propuestas ni crea avisos directamente: solo las funciones de abajo.
revoke all on public.propuestas, public.avisos from anon, authenticated;
grant select on public.propuestas, public.avisos to authenticated;
grant update (leido_en, atendido_en) on public.avisos to authenticated;

create policy "mis propuestas" on public.propuestas for select to authenticated
  using (propuesto_por = (select auth.uid()));
create policy "administrador ve propuestas" on public.propuestas for select to authenticated
  using ((select private.es_administrador()));
create policy "mis avisos" on public.avisos for select to authenticated
  using (usuario_id = (select auth.uid()));
create policy "marcar mis avisos" on public.avisos for update to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

-- El administrador ve lo propuesto por otros para revisarlo (políticas aparte: anon no puede llamar a private).
create policy "administrador ve ciudades" on public.ciudades for select to authenticated
  using ((select private.es_administrador()));
create policy "administrador ve empresas" on public.empresas for select to authenticated
  using ((select private.es_administrador()));
create policy "administrador ve catalogo" on public.aparatos_referencia for select to authenticated
  using ((select private.es_administrador()));

-- Toda fila nueva en estado 'propuesta' (ciudad, empresa o ficha) abre una propuesta.
create function private.registrar_propuesta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'ciudades' then
    insert into public.propuestas (tipo, propuesto_por, ciudad_id) values ('ciudad', new.propuesta_por, new.id);
  elsif tg_table_name = 'empresas' then
    insert into public.propuestas (tipo, propuesto_por, empresa_id) values ('empresa', new.propuesta_por, new.id);
  else
    insert into public.propuestas (tipo, propuesto_por, aparato_referencia_id) values ('aparato', new.propuesto_por, new.id);
  end if;
  return null;
end;
$$;
revoke all on function private.registrar_propuesta() from public;

create trigger registrar_propuesta after insert on public.ciudades
  for each row when (new.estado = 'propuesta') execute function private.registrar_propuesta();
create trigger registrar_propuesta after insert on public.empresas
  for each row when (new.estado = 'propuesta') execute function private.registrar_propuesta();
create trigger registrar_propuesta after insert on public.aparatos_referencia
  for each row when (new.estado = 'propuesta') execute function private.registrar_propuesta();

-- Propuestas que ya existían (registros anteriores a este ticket).
insert into public.propuestas (tipo, propuesto_por, ciudad_id, creado_en)
  select 'ciudad', propuesta_por, id, creado_en from public.ciudades where estado = 'propuesta';
insert into public.propuestas (tipo, propuesto_por, empresa_id, creado_en)
  select 'empresa', propuesta_por, id, creado_en from public.empresas where estado = 'propuesta';
insert into public.propuestas (tipo, propuesto_por, aparato_referencia_id, creado_en)
  select 'aparato', propuesto_por, id, creado_en from public.aparatos_referencia where estado = 'propuesta';

-- El usuario propone uno de sus aparatos al catálogo. Su aparato queda ligado a la ficha propuesta
-- y lo sigue usando igual mientras se revisa o si la rechazan (su potencia es una copia propia).
create function private.proponer_aparato(p_aparato bigint, p_marca text, p_modelo text)
returns bigint
language plpgsql
security definer
set search_path = ''
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

  insert into public.aparatos_referencia (tipo, marca, modelo, potencia_w, criterio_potencia, fuente, estado, propuesto_por)
  values (a.tipo, trim(p_marca), trim(p_modelo), a.potencia_w, 'nominal', 'Etiqueta del aparato (propuesta de un usuario)', 'propuesta', a.usuario_id)
  returning id into v_ref;
  update public.aparatos set referencia_id = v_ref where id = a.id;
  return v_ref;
end;
$$;

-- Aprobar, rechazar, posponer o unir (ciudad o empresa duplicada) una propuesta. Solo el administrador.
create function private.resolver_propuesta(p_id bigint, p_decision text, p_nota text default null, p_unir_con bigint default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.propuestas;
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
  else
    select nombre into v_nombre from public.empresas where id = p.empresa_id;
    if p_decision = 'unida' then
      select nombre into v_existente from public.empresas where id = p_unir_con and estado = 'aprobada';
      if v_existente is null then raise exception 'La empresa existente no es válida'; end if;
      update public.perfiles set empresa_id = p_unir_con where empresa_id = p.empresa_id;
      delete from public.empresas where id = p.empresa_id;
    elsif p_decision in ('aprobada', 'rechazada') then
      update public.empresas set estado = p_decision where id = p.empresa_id;
    end if;
  end if;

  update public.propuestas
  set estado = p_decision, nota = v_nota, decidido_por = (select auth.uid()), decidido_en = now()
  where id = p_id;

  -- Posponer no es un resultado: el usuario no recibe aviso hasta la decisión final.
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

-- Corregir una ficha aprobada del catálogo. Avisa a quien tenga una copia con otra potencia;
-- cada quien decide si actualiza la suya. Devuelve cuántos avisos se enviaron.
create function private.corregir_referencia(p_id bigint, p_potencia_w numeric, p_criterio text, p_fuente text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.aparatos_referencia;
  v_avisos integer;
begin
  if not private.es_administrador() then
    raise exception 'Solo el administrador puede corregir el catálogo' using errcode = '42501';
  end if;
  update public.aparatos_referencia
  set potencia_w = p_potencia_w,
      criterio_potencia = p_criterio,
      fuente = coalesce(nullif(trim(p_fuente), ''), fuente),
      actualizado_en = now()
  where id = p_id and estado = 'aprobada'
  returning * into r;
  if not found then
    raise exception 'Ficha no encontrada';
  end if;

  insert into public.avisos (usuario_id, tipo, titulo, cuerpo, aparato_id, referencia_id)
  select a.usuario_id, 'ficha_corregida', 'Corregimos una ficha del catálogo',
    format('La ficha de «%s» ahora dice %s W. Tu aparato «%s» tiene %s W. ¿Actualizas tu copia?',
      coalesce(r.marca || ' ' || r.modelo, r.tipo), r.potencia_w, a.nombre, a.potencia_w),
    a.id, r.id
  from public.aparatos a
  where a.referencia_id = r.id and a.archivado_en is null and a.potencia_w <> r.potencia_w;
  get diagnostics v_avisos = row_count;
  return v_avisos;
end;
$$;

revoke all on function private.proponer_aparato(bigint, text, text) from public;
revoke all on function private.resolver_propuesta(bigint, text, text, bigint) from public;
revoke all on function private.corregir_referencia(bigint, numeric, text, text) from public;
grant execute on function private.proponer_aparato(bigint, text, text) to authenticated;
grant execute on function private.resolver_propuesta(bigint, text, text, bigint) to authenticated;
grant execute on function private.corregir_referencia(bigint, numeric, text, text) to authenticated;

-- RPC expuestas: envoltorios invoker sobre las funciones de private (que verifican el rol por dentro).
create function public.proponer_aparato(p_aparato bigint, p_marca text, p_modelo text)
returns bigint language sql security invoker set search_path = ''
as $$ select private.proponer_aparato(p_aparato, p_marca, p_modelo) $$;

create function public.resolver_propuesta(p_id bigint, p_decision text, p_nota text default null, p_unir_con bigint default null)
returns void language sql security invoker set search_path = ''
as $$ select private.resolver_propuesta(p_id, p_decision, p_nota, p_unir_con) $$;

create function public.corregir_referencia(p_id bigint, p_potencia_w numeric, p_criterio text, p_fuente text default null)
returns integer language sql security invoker set search_path = ''
as $$ select private.corregir_referencia(p_id, p_potencia_w, p_criterio, p_fuente) $$;

-- El usuario acepta la ficha corregida: copia su potencia y da el aviso por atendido. Todo con su propia RLS.
create function public.actualizar_copia(p_aviso bigint)
returns void language sql security invoker set search_path = ''
as $$
  update public.aparatos a set potencia_w = r.potencia_w
  from public.avisos v join public.aparatos_referencia r on r.id = v.referencia_id
  where v.id = p_aviso and v.tipo = 'ficha_corregida' and a.id = v.aparato_id;
  update public.avisos set atendido_en = now(), leido_en = coalesce(leido_en, now()) where id = p_aviso;
$$;

revoke all on function public.proponer_aparato(bigint, text, text) from public, anon;
revoke all on function public.resolver_propuesta(bigint, text, text, bigint) from public, anon;
revoke all on function public.corregir_referencia(bigint, numeric, text, text) from public, anon;
revoke all on function public.actualizar_copia(bigint) from public, anon;
grant execute on function public.proponer_aparato(bigint, text, text) to authenticated;
grant execute on function public.resolver_propuesta(bigint, text, text, bigint) to authenticated;
grant execute on function public.corregir_referencia(bigint, numeric, text, text) to authenticated;
grant execute on function public.actualizar_copia(bigint) to authenticated;
