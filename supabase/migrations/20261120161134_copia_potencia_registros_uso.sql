-- Copia de potencia y cantidad en cada registro de uso: los periodos cerrados conservan los valores que tenían.
alter table public.registros_uso add column potencia_w numeric, add column cantidad integer;
update public.registros_uso r set potencia_w = a.potencia_w, cantidad = a.cantidad from public.aparatos a where a.id = r.aparato_id;
alter table public.registros_uso alter column potencia_w set not null, alter column cantidad set not null;

-- Al insertar, la copia sale siempre del aparato (el usuario no la puede indicar).
create function private.copiar_potencia_registro() returns trigger
language plpgsql security invoker set search_path = ''
as $$
begin
  select potencia_w, cantidad into new.potencia_w, new.cantidad from public.aparatos where id = new.aparato_id;
  return new;
end $$;
revoke execute on function private.copiar_potencia_registro() from public, anon, authenticated;
create trigger a_copiar_potencia before insert on public.registros_uso
  for each row execute function private.copiar_potencia_registro();

-- Al editar potencia o cantidad del aparato, solo se actualizan los registros que no caen en un periodo cerrado.
create function private.propagar_potencia_aparato() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.registros_uso r set potencia_w = new.potencia_w, cantidad = new.cantidad
  where r.aparato_id = new.id
    and not exists (select 1 from public.periodos p
      where p.usuario_id = r.usuario_id and p.estado = 'cerrado' and r.fecha between p.inicio and p.fin_real);
  return null;
end $$;
revoke execute on function private.propagar_potencia_aparato() from public, anon, authenticated;
create trigger propagar_potencia after update of potencia_w, cantidad on public.aparatos
  for each row when (old.potencia_w is distinct from new.potencia_w or old.cantidad is distinct from new.cantidad)
  execute function private.propagar_potencia_aparato();

-- El consumo calculado usa la copia del registro.
create or replace view public.consumo_calculado with (security_invoker = true) as
select r.id, r.usuario_id, r.aparato_id, r.fecha, r.horas, r.origen,
  round(r.potencia_w * r.cantidad * r.horas / 1000, 3) as kwh,
  round(r.potencia_w * r.cantidad * r.horas / 1000 * coalesce(
    public.tarifa_vigente(r.usuario_id, r.fecha),
    (select t.valor_kwh from public.tarifas_usuario t where t.usuario_id = r.usuario_id order by t.desde, t.id limit 1),
    0), 2) as costo
from public.registros_uso r;
