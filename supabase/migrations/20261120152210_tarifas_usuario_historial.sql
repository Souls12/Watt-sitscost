-- Historial de tarifa propia: cada fila es un valor por kWh con su fecha de inicio.
-- La tarifa vigente en un día es la fila con la mayor fecha de inicio <= ese día.
-- tarifa_compartida_version_id queda null por ahora; el ticket 14 (tarifas compartidas) lo enlazará.
create table public.tarifas_usuario (
  id bigint generated always as identity primary key,
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  valor_kwh numeric(10, 2) not null check (valor_kwh > 0),
  desde date not null default (now() at time zone 'America/Bogota')::date,
  creado_en timestamptz not null default now(),
  tarifa_compartida_version_id bigint
);
create index on public.tarifas_usuario (usuario_id, desde desc, id desc);

alter table public.tarifas_usuario enable row level security;
revoke all on public.tarifas_usuario from anon, authenticated;
-- Solo valor_kwh y usuario_id: la fecha de inicio la pone el sistema. El historial no se edita ni se borra.
grant select on public.tarifas_usuario to authenticated;
grant insert (valor_kwh, usuario_id) on public.tarifas_usuario to authenticated;

create policy "ver mi tarifa" on public.tarifas_usuario for select to authenticated
  using (usuario_id = (select auth.uid()));
create policy "agregar mi tarifa" on public.tarifas_usuario for insert to authenticated
  with check (usuario_id = (select auth.uid()));

-- Tarifa vigente de un usuario en una fecha (invoker: RLS limita a la propia).
create function public.tarifa_vigente(p_usuario uuid, p_fecha date default (now() at time zone 'America/Bogota')::date)
returns numeric
language sql stable security invoker set search_path = ''
as $$
  select valor_kwh from public.tarifas_usuario
  where usuario_id = p_usuario and desde <= p_fecha
  order by desde desc, id desc limit 1
$$;
revoke execute on function public.tarifa_vigente(uuid, date) from public, anon;
grant execute on function public.tarifa_vigente(uuid, date) to authenticated;

-- La tarifa del paso de registro viaja en los metadatos del alta (aún no hay sesión por la confirmación de correo).
create function private.crear_tarifa_inicial() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare v text := new.raw_user_meta_data ->> 'tarifa_kwh';
begin
  if v ~ '^\d{1,8}(\.\d{1,2})?$' and v::numeric > 0 then
    insert into public.tarifas_usuario (usuario_id, valor_kwh) values (new.id, v::numeric);
  end if;
  return new;
end $$;
revoke execute on function private.crear_tarifa_inicial() from public, anon, authenticated;
create trigger crear_tarifa_inicial after insert on auth.users
  for each row execute function private.crear_tarifa_inicial();
