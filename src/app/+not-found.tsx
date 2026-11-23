import { Redirect } from 'expo-router';
import { useSesion } from '@/lib/sesion';
import { useBienvenida } from '@/lib/ajustes';

// Al abrir sin sesión, "/" (pestaña Mes) está protegida y no coincide: lleva a la pantalla que la sesión permite.
export default function NoEncontrada() {
  const { session, recuperando } = useSesion();
  const { bienvenida } = useBienvenida();
  if (!session) return <Redirect href="/entrar" />;
  if (recuperando) return <Redirect href="/nueva-contrasena" />;
  return <Redirect href={bienvenida ? '/bienvenida' : '/'} />;
}
