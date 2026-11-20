-- Ticket #6: tipos de aparato (color fijo), aparatos de referencia (catálogo) y aparatos del usuario.

-- Tipo de aparato: un color fijo por tipo, igual en listas y registros.
create table public.tipos_aparato (
  nombre text primary key,
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$')
);
insert into public.tipos_aparato (nombre, color) values
  ('Nevera/Nevecón', '#3A7CA5'),
  ('Lavadora', '#6B5CA5'),
  ('Aire acondicionado', '#2A9D8F'),
  ('Ventilador', '#7FB069'),
  ('Ducha eléctrica', '#E07A5F'),
  ('Plancha', '#B5651D'),
  ('Televisor', '#4A4E69'),
  ('Licuadora', '#C9548A'),
  ('Otro', '#8A8578');

-- Aparato de referencia (catálogo). Marca y modelo nulos = ficha genérica.
-- estado/propuesto_por/actualizado_en dejan espacio al ticket #13 (propuestas y correcciones del administrador).
create table public.aparatos_referencia (
  id bigint generated always as identity primary key,
  tipo text not null references public.tipos_aparato (nombre),
  marca text check (length(trim(marca)) between 1 and 80),
  modelo text check (length(trim(modelo)) between 1 and 120),
  potencia_w numeric not null check (potencia_w > 0),
  criterio_potencia text not null check (criterio_potencia in ('nominal', 'maximo_rango', 'maximo_publicado')),
  consumo_kwh_mes_etiqueta numeric check (consumo_kwh_mes_etiqueta > 0),
  capacidad text,
  fuente text not null,
  estado text not null default 'aprobada' check (estado in ('aprobada', 'propuesta', 'rechazada')),
  propuesto_por uuid references auth.users (id) on delete set null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  check ((marca is null) = (modelo is null))
);
create unique index aparatos_referencia_unicos on public.aparatos_referencia (tipo, coalesce(marca, ''), coalesce(modelo, ''))
  where estado = 'aprobada';
create index aparatos_referencia_propuesto_por_idx on public.aparatos_referencia (propuesto_por) where propuesto_por is not null;

-- Aparato del usuario: copia propia de la potencia y recuerdo de la ficha de origen.
create table public.aparatos (
  id bigint generated always as identity primary key,
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  referencia_id bigint references public.aparatos_referencia (id) on delete set null,
  nombre text not null check (length(trim(nombre)) between 1 and 80),
  tipo text not null references public.tipos_aparato (nombre),
  potencia_w numeric not null check (potencia_w > 0 and potencia_w <= 100000),
  cantidad integer not null default 1 check (cantidad between 1 and 999),
  uso_tipico_horas numeric check (uso_tipico_horas > 0 and uso_tipico_horas <= 24),
  uso_constante boolean not null default false,
  archivado_en timestamptz,
  creado_en timestamptz not null default now(),
  check (not uso_constante or uso_tipico_horas is not null)
);
create index aparatos_usuario_idx on public.aparatos (usuario_id);
create index aparatos_referencia_id_idx on public.aparatos (referencia_id) where referencia_id is not null;
create index aparatos_tipo_idx on public.aparatos (tipo);

alter table public.tipos_aparato enable row level security;
alter table public.aparatos_referencia enable row level security;
alter table public.aparatos enable row level security;

revoke all on public.tipos_aparato, public.aparatos_referencia, public.aparatos from anon, authenticated;
grant select on public.tipos_aparato to anon, authenticated;
grant select on public.aparatos_referencia to authenticated;
-- "Eliminar" archiva (UPDATE de archivado_en): no hay DELETE. El origen y el dueño no se editan.
grant select, insert (referencia_id, nombre, tipo, potencia_w, cantidad, uso_tipico_horas, uso_constante) on public.aparatos to authenticated;
grant update (nombre, tipo, potencia_w, cantidad, uso_tipico_horas, uso_constante, archivado_en) on public.aparatos to authenticated;

create policy "tipos legibles" on public.tipos_aparato for select to anon, authenticated using (true);
create policy "catalogo aprobado o propio" on public.aparatos_referencia for select to authenticated
  using (estado = 'aprobada' or propuesto_por = (select auth.uid()));
create policy "ver mis aparatos" on public.aparatos for select to authenticated
  using (usuario_id = (select auth.uid()));
create policy "agregar mis aparatos" on public.aparatos for insert to authenticated
  with check (usuario_id = (select auth.uid()));
create policy "editar mis aparatos" on public.aparatos for update to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));
