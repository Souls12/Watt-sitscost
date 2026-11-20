-- Ticket #14: tarifas compartidas con versiones.
-- Cada fila de tarifas_compartidas es una versión; las versiones de una misma tarifa comparten tarifa_id.
-- Una versión nueva nace 'pendiente' (con su propuesta) y solo la ven su autor y el administrador;
-- aprobada, la ven los usuarios de la misma ciudad, estrato y empresa.
create sequence private.tarifas_compartidas_linea_seq;

create table public.tarifas_compartidas (
  id bigint generated always as identity primary key,
  tarifa_id bigint not null,
  autor_id uuid not null references auth.users (id) on delete cascade,
  ciudad_id bigint not null references public.ciudades (id) on delete cascade,
  estrato smallint not null check (estrato between 1 and 6),
  empresa_id bigint not null references public.empresas (id) on delete cascade,
  valor_kwh numeric(10, 2) not null check (valor_kwh > 0),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  desde date,
  creado_en timestamptz not null default now()
);
create index on public.tarifas_compartidas (ciudad_id, estrato, empresa_id, id desc) where estado = 'aprobada';
create index on public.tarifas_compartidas (autor_id);
create index on public.tarifas_compartidas (empresa_id);
create index on public.tarifas_compartidas (tarifa_id);
create unique index tarifas_compartidas_una_pendiente on public.tarifas_compartidas (tarifa_id) where estado = 'pendiente';

alter table public.tarifas_compartidas enable row level security;
revoke all on public.tarifas_compartidas from anon, authenticated;
-- Sin autor_id: los vecinos ven valor y fecha, no quién la compartió. Nadie escribe directo.
grant select (id, tarifa_id, ciudad_id, estrato, empresa_id, valor_kwh, estado, desde, creado_en)
  on public.tarifas_compartidas to authenticated;

create policy "tarifas compartidas visibles" on public.tarifas_compartidas for select to authenticated
  using (
    autor_id = (select auth.uid())
    or (select private.es_administrador())
    or (estado = 'aprobada' and exists (
      select 1 from public.perfiles p
      where p.id = (select auth.uid()) and p.ciudad_id = tarifas_compartidas.ciudad_id
        and p.estrato = tarifas_compartidas.estrato and p.empresa_id = tarifas_compartidas.empresa_id))
  );

-- Enlace de la tarifa propia con la compartida elegida.
alter table public.tarifas_usuario
  add constraint tarifas_usuario_compartida_fk foreign key (tarifa_compartida_version_id)
  references public.tarifas_compartidas (id) on delete set null;
create index on public.tarifas_usuario (tarifa_compartida_version_id) where tarifa_compartida_version_id is not null;

-- Propuestas y avisos del tipo nuevo.
alter table public.propuestas add column tarifa_version_id bigint references public.tarifas_compartidas (id) on delete cascade;
create index propuestas_tarifa_idx on public.propuestas (tarifa_version_id) where tarifa_version_id is not null;
alter table public.propuestas drop constraint propuestas_tipo_check, drop constraint propuestas_check;
alter table public.propuestas
  add constraint propuestas_tipo_check check (tipo in ('aparato', 'ciudad', 'empresa', 'tarifa')),
  add constraint propuestas_check check (num_nonnulls(aparato_referencia_id, ciudad_id, empresa_id, tarifa_version_id) <= 1);

alter table public.avisos add column tarifa_version_id bigint references public.tarifas_compartidas (id) on delete cascade;
create index avisos_tarifa_idx on public.avisos (tarifa_version_id) where tarifa_version_id is not null;
alter table public.avisos drop constraint avisos_tipo_check;
alter table public.avisos add constraint avisos_tipo_check
  check (tipo in ('propuesta_resuelta', 'ficha_corregida', 'tarifa_nueva'));

-- Compartir (o actualizar) la tarifa propia: crea una versión pendiente y su propuesta.
create function private.compartir_tarifa(p_valor numeric) returns bigint
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  pf public.perfiles;
  v_linea bigint;
  v_id bigint;
begin
  if v_uid is null then raise exception 'Inicia sesión' using errcode = '42501'; end if;
  if p_valor is null or p_valor <= 0 or p_valor >= 100000000 then raise exception 'Valor no válido'; end if;
  select * into pf from public.perfiles where id = v_uid;
  if not exists (select 1 from public.ciudades where id = pf.ciudad_id and estado = 'aprobada')
     or not exists (select 1 from public.empresas where id = pf.empresa_id and estado = 'aprobada') then
    raise exception 'Tu ciudad y tu empresa deben estar aprobadas para compartir tu tarifa';
  end if;

  select tarifa_id into v_linea from public.tarifas_compartidas
  where autor_id = v_uid and ciudad_id = pf.ciudad_id and estrato = pf.estrato and empresa_id = pf.empresa_id
  order by id desc limit 1;
  if exists (select 1 from public.tarifas_compartidas where tarifa_id = v_linea and estado = 'pendiente') then
    raise exception 'Ya tienes una versión pendiente de revisión';
  end if;

  insert into public.tarifas_compartidas (tarifa_id, autor_id, ciudad_id, estrato, empresa_id, valor_kwh)
  values (coalesce(v_linea, nextval('private.tarifas_compartidas_linea_seq')), v_uid, pf.ciudad_id, pf.estrato, pf.empresa_id, round(p_valor, 2))
  returning id into v_id;
  insert into public.propuestas (tipo, propuesto_por, tarifa_version_id) values ('tarifa', v_uid, v_id);
  return v_id;
end $$;

-- Quedar enlazado a una tarifa compartida aprobada de mi misma ciudad, estrato y empresa:
-- agrega una fila al historial propio con el valor y el enlace.
create function private.enlazar_tarifa(p_version bigint) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  t public.tarifas_compartidas;
begin
  select c.* into t from public.tarifas_compartidas c
  join public.perfiles p on p.id = v_uid and p.ciudad_id = c.ciudad_id and p.estrato = c.estrato and p.empresa_id = c.empresa_id
  where c.id = p_version and c.estado = 'aprobada';
  if not found then raise exception 'Esa tarifa no está disponible para ti'; end if;
  insert into public.tarifas_usuario (usuario_id, valor_kwh, tarifa_compartida_version_id)
  values (v_uid, t.valor_kwh, t.id);
end $$;

-- Adoptar la versión nueva de un aviso 'tarifa_nueva' (o dejarla: eso lo hace el cliente con atendido_en).
create function private.adoptar_tarifa(p_aviso bigint) returns void
language plpgsql security definer set search_path = ''
as $$
declare v_version bigint;
begin
  select tarifa_version_id into v_version from public.avisos
  where id = p_aviso and usuario_id = (select auth.uid()) and tipo = 'tarifa_nueva' and atendido_en is null for update;
  if not found then raise exception 'Aviso no encontrado'; end if;
  perform private.enlazar_tarifa(v_version);
  update public.avisos set atendido_en = now(), leido_en = coalesce(leido_en, now()) where id = p_aviso;
end $$;

revoke all on function private.compartir_tarifa(numeric), private.enlazar_tarifa(bigint), private.adoptar_tarifa(bigint) from public;
grant execute on function private.compartir_tarifa(numeric), private.enlazar_tarifa(bigint), private.adoptar_tarifa(bigint) to authenticated;

create function public.compartir_tarifa(p_valor numeric) returns bigint
language sql security invoker set search_path = '' as $$ select private.compartir_tarifa(p_valor) $$;
create function public.elegir_tarifa(p_version bigint) returns void
language sql security invoker set search_path = '' as $$ select private.enlazar_tarifa(p_version) $$;
create function public.adoptar_tarifa(p_aviso bigint) returns void
language sql security invoker set search_path = '' as $$ select private.adoptar_tarifa(p_aviso) $$;
revoke all on function public.compartir_tarifa(numeric), public.elegir_tarifa(bigint), public.adoptar_tarifa(bigint) from public, anon;
grant execute on function public.compartir_tarifa(numeric), public.elegir_tarifa(bigint), public.adoptar_tarifa(bigint) to authenticated;

-- resolver_propuesta con la rama 'tarifa': aprobar publica la versión y avisa a los enlazados a una versión anterior.
create or replace function private.resolver_propuesta(p_id bigint, p_decision text, p_nota text default null, p_unir_con bigint default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
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
    v_nombre := format('Tu tarifa de $%s por kWh', t.valor_kwh);
    if p_decision = 'aprobada' then
      -- Solo quien hoy sigue una versión anterior de esta tarifa; su tarifa vigente no cambia hasta que adopte.
      insert into public.avisos (usuario_id, tipo, titulo, cuerpo, propuesta_id, tarifa_version_id)
      select u.usuario_id, 'tarifa_nueva', 'Cambió una tarifa compartida',
        format('La tarifa que sigues pasó de $%s a $%s por kWh. Tu tarifa vigente no cambia hasta que decidas adoptarla.', o.valor_kwh, t.valor_kwh),
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
