-- Ticket #13: una sola política SELECT por rol (el linter avisa de políticas permisivas múltiples).
-- anon no puede llamar a private.es_administrador(), por eso tiene su política aparte.

drop policy "administrador ve propuestas" on public.propuestas;
drop policy "mis propuestas" on public.propuestas;
create policy "mis propuestas o administrador" on public.propuestas for select to authenticated
  using (propuesto_por = (select auth.uid()) or (select private.es_administrador()));

drop policy "administrador ve catalogo" on public.aparatos_referencia;
drop policy "catalogo aprobado o propio" on public.aparatos_referencia;
create policy "catalogo aprobado, propio o administrador" on public.aparatos_referencia for select to authenticated
  using (estado = 'aprobada' or propuesto_por = (select auth.uid()) or (select private.es_administrador()));

drop policy "administrador ve ciudades" on public.ciudades;
drop policy "ciudades aprobadas o propias" on public.ciudades;
create policy "ciudades aprobadas" on public.ciudades for select to anon
  using (estado = 'aprobada');
create policy "ciudades aprobadas, propias o administrador" on public.ciudades for select to authenticated
  using (estado = 'aprobada' or propuesta_por = (select auth.uid()) or (select private.es_administrador()));

drop policy "administrador ve empresas" on public.empresas;
drop policy "empresas aprobadas o propias" on public.empresas;
create policy "empresas aprobadas" on public.empresas for select to anon
  using (estado = 'aprobada');
create policy "empresas aprobadas, propias o administrador" on public.empresas for select to authenticated
  using (estado = 'aprobada' or propuesta_por = (select auth.uid()) or (select private.es_administrador()));
