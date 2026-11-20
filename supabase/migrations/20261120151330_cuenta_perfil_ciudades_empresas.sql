-- Ticket #4: ciudades, empresas proveedoras y perfil ligado al usuario de Auth.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- Ciudades y empresas: listas fijas. Una 'propuesta' la crea un usuario al registrarse y la revisa el administrador.
create table public.ciudades (
  id bigint generated always as identity primary key,
  nombre text not null check (length(trim(nombre)) between 1 and 80),
  departamento text check (length(trim(departamento)) between 1 and 80),
  estado text not null default 'propuesta' check (estado in ('aprobada', 'propuesta')),
  propuesta_por uuid references auth.users (id) on delete set null,
  creado_en timestamptz not null default now()
);
create unique index ciudades_aprobadas_unicas on public.ciudades (lower(nombre), lower(departamento)) where estado = 'aprobada';
create index ciudades_propuesta_por_idx on public.ciudades (propuesta_por) where propuesta_por is not null;

create table public.empresas (
  id bigint generated always as identity primary key,
  nombre text not null check (length(trim(nombre)) between 1 and 80),
  estado text not null default 'propuesta' check (estado in ('aprobada', 'propuesta')),
  propuesta_por uuid references auth.users (id) on delete set null,
  creado_en timestamptz not null default now()
);
create unique index empresas_aprobadas_unicas on public.empresas (lower(nombre)) where estado = 'aprobada';
create index empresas_propuesta_por_idx on public.empresas (propuesta_por) where propuesta_por is not null;

-- Perfil: el rol solo se cambia a mano en la base de datos (el usuario no tiene permiso de UPDATE sobre esa columna).
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null check (length(trim(nombre)) between 1 and 80),
  ciudad_id bigint not null references public.ciudades (id),
  estrato smallint not null check (estrato between 1 and 6),
  empresa_id bigint not null references public.empresas (id),
  rol text not null default 'usuario' check (rol in ('usuario', 'administrador')),
  cifra_principal text not null default 'kwh' check (cifra_principal in ('kwh', 'pesos')),
  creado_en timestamptz not null default now()
);
create index perfiles_ciudad_id_idx on public.perfiles (ciudad_id);
create index perfiles_empresa_id_idx on public.perfiles (empresa_id);

alter table public.ciudades enable row level security;
alter table public.empresas enable row level security;
alter table public.perfiles enable row level security;

-- Supabase da ALL por defecto a anon/authenticated en public: se quita y se da solo lo necesario.
revoke all on public.ciudades, public.empresas, public.perfiles from anon, authenticated;
grant select on public.ciudades, public.empresas to anon, authenticated;
grant select on public.perfiles to authenticated;
grant update (nombre, ciudad_id, estrato, empresa_id, cifra_principal) on public.perfiles to authenticated;

-- anon lee las listas en la pantalla de registro (antes de tener sesión).
create policy "ciudades aprobadas o propias" on public.ciudades for select to anon, authenticated
  using (estado = 'aprobada' or propuesta_por = (select auth.uid()));
create policy "empresas aprobadas o propias" on public.empresas for select to anon, authenticated
  using (estado = 'aprobada' or propuesta_por = (select auth.uid()));

create policy "ver mi perfil" on public.perfiles for select to authenticated
  using (id = (select auth.uid()));
create policy "editar mi perfil" on public.perfiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Para políticas de tickets futuros: ¿quien llama es administrador?
create function private.es_administrador()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and rol = 'administrador'
  );
$$;
revoke all on function private.es_administrador() from public;
grant execute on function private.es_administrador() to authenticated;

-- Crea el perfil al registrarse con los datos del formulario (raw_user_meta_data).
-- user_metadata solo aporta datos del perfil; el rol nunca se lee de ahí.
-- Si el usuario no encuentra su ciudad o empresa, se crea como propuesta y queda ligada a su perfil.
create function private.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_ciudad bigint;
  v_empresa bigint;
begin
  if nullif(trim(m ->> 'ciudad_propuesta'), '') is not null then
    insert into public.ciudades (nombre, departamento, estado, propuesta_por)
    values (trim(m ->> 'ciudad_propuesta'), nullif(trim(m ->> 'departamento_propuesto'), ''), 'propuesta', new.id)
    returning id into v_ciudad;
  else
    select id into v_ciudad from public.ciudades
    where id = (m ->> 'ciudad_id')::bigint and estado = 'aprobada';
  end if;

  if nullif(trim(m ->> 'empresa_propuesta'), '') is not null then
    insert into public.empresas (nombre, estado, propuesta_por)
    values (trim(m ->> 'empresa_propuesta'), 'propuesta', new.id)
    returning id into v_empresa;
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
revoke all on function private.crear_perfil() from public;

create trigger crear_perfil_al_registrarse
  after insert on auth.users
  for each row execute function private.crear_perfil();
