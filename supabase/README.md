# Supabase

Proyecto `jyvmnfcnfqjfmsdbtlne`. Sin Docker: cada migración de `migrations/` se aplica al proyecto remoto (MCP `apply_migration`) y el archivo lleva la misma versión que quedó registrada allá (`list_migrations`).

## Ajustes que se hacen a mano en el dashboard

Authentication → Sign In / Providers → Email:
- **Confirm email**: desactivado (decisión del usuario, 2026-11-20: por ahora se registra y entra sin confirmar el correo). Si se vuelve a activar, la app ya sabe mostrar "Revisa tu correo".
- **Minimum password length**: 8.
- **Password requirements**: la opción de letras y dígitos (la app valida lo mismo en `src/lib/validacion.ts`).

Authentication → URL Configuration → **Redirect URLs**, agregar:
- `wattsitcost://**` (app instalada / development build).
- `exp://**` solo mientras se prueba con Expo Go.

Sin esto, el enlace de "Olvidé mi contraseña" (y el de confirmación, si se activa) no vuelve a la app (Supabase redirige al Site URL). La confirmación del correo igual queda hecha al abrir el enlace; luego se entra con la contraseña.

Authentication → Attack Protection → **CAPTCHA** (Turnstile o hCaptcha): recomendado antes de publicar. Limita los registros automatizados (la base ya reutiliza ciudades/empresas propuestas repetidas, pero el registro masivo de cuentas solo lo frena el CAPTCHA). Requiere enviar el token desde la app en `signUp`.

Pruebas de la base: `supabase/tests/escenarios.sql` (corre en una transacción con ROLLBACK; no deja datos).

No activar "Single session per user": la app permite sesión en varios teléfonos y cierra sesión solo en el teléfono actual.

## Dar el rol de administrador

```sql
update public.perfiles set rol = 'administrador' where id = '<uuid del usuario>';
```
