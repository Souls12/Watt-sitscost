-- Registro paso 1: saber si el correo ya tiene cuenta antes de llenar todo el formulario.
-- signUp ya revela lo mismo (user_already_exists, sin confirmación de correo), así que no expone nada nuevo.
create or replace function public.correo_registrado(correo text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from auth.users where lower(email) = lower(trim(correo)));
$$;
revoke execute on function public.correo_registrado(text) from public;
grant execute on function public.correo_registrado(text) to anon, authenticated;
