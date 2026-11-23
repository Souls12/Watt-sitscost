-- La bienvenida se recorre una vez por cuenta, no por teléfono. Cuentas existentes: false, la ven una vez.
alter table public.perfiles add column bienvenida_completada boolean not null default false;
grant update (bienvenida_completada) on public.perfiles to authenticated;
