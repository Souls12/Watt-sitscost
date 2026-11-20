# Supabase

Proyecto `jyvmnfcnfqjfmsdbtlne`. Sin Docker: cada migración de `migrations/` se aplica al proyecto remoto (MCP `apply_migration`) y el archivo lleva la misma versión que quedó registrada allá (`list_migrations`).

## Ajustes que se hacen a mano en el dashboard

Authentication → Sign In / Providers → Email:
- **Confirm email**: activado.
- **Minimum password length**: 8.
- **Password requirements**: la opción de letras y dígitos (la app valida lo mismo en `src/lib/validacion.ts`).

Authentication → URL Configuration → **Redirect URLs**, agregar:
- `wattsitcost://**` (app instalada / development build).
- `exp://**` solo mientras se prueba con Expo Go.

Sin esto, los enlaces de confirmación y de "Olvidé mi contraseña" no vuelven a la app (Supabase redirige al Site URL). La confirmación del correo igual queda hecha al abrir el enlace; luego se entra con la contraseña.

No activar "Single session per user": la app permite sesión en varios teléfonos y cierra sesión solo en el teléfono actual.

## Dar el rol de administrador

```sql
update public.perfiles set rol = 'administrador' where id = '<uuid del usuario>';
```
