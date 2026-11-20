-- create or replace view descartó la opción; se restablece.
alter view public.panel_hoy set (security_invoker = true);
