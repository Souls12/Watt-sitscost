import { Text } from 'react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { Stack } from 'expo-router';
import { Rutas } from '@/app/_layout';

// Estado de sesión simulado: la prueba decide quién abre la app.
let mockSesion: { session: object | null; recuperando: boolean } = { session: null, recuperando: false };
let mockBienvenida: boolean | null = false;
jest.mock('@/lib/sesion', () => ({ useSesion: () => ({ ...mockSesion, cargando: false }) }));
jest.mock('@/lib/ajustes', () => ({ useBienvenida: () => ({ bienvenida: mockBienvenida }) }));
// Las fuentes del RootLayout no afectan la navegación.
jest.mock('expo-font', () => ({ useFonts: () => [true] }));
jest.mock('@expo-google-fonts/zilla-slab', () => ({}));
jest.mock('@expo-google-fonts/atkinson-hyperlegible', () => ({}));

const pantalla = (nombre: string) => () => <Text>{nombre}</Text>;
// Las rutas reales de src/app, con pantallas de cartón; el _layout es el real (Rutas).
const rutas = {
  _layout: Rutas,
  '(tabs)/_layout': () => <Stack />,
  '(tabs)/index': pantalla('Mes'),
  '(auth)/_layout': () => <Stack />,
  '(auth)/entrar': pantalla('Entrar'),
  '(auth)/registro': pantalla('Registro'),
  '(auth)/recuperar': pantalla('Recuperar'),
  bienvenida: pantalla('Bienvenida'),
  tutorial: pantalla('Cómo funciona'),
  'nueva-contrasena': pantalla('Nueva contraseña'),
  cuenta: pantalla('Cuenta'),
  tarifa: pantalla('Tarifa'),
  catalogo: pantalla('Catálogo'),
  referencia: pantalla('Referencia'),
  aparato: pantalla('Aparato'),
  avisos: pantalla('Avisos'),
  revision: pantalla('Revisión'),
};

// Al abrir el APK la URL inicial es "/" (la pestaña Mes).
test.each([
  ['cuenta con bienvenida pendiente', { session: {}, recuperando: false }, true, '/bienvenida'],
  ['sin sesión', { session: null, recuperando: false }, false, '/entrar'],
  ['cuenta lista', { session: {}, recuperando: false }, false, '/'],
  ['enlace de recuperación', { session: {}, recuperando: true }, false, '/nueva-contrasena'],
])('al abrir la app (%s) llega a la pantalla correcta', async (_caso, s, b, esperada) => {
  mockSesion = s;
  mockBienvenida = b;
  await renderRouter(rutas, { initialUrl: '/' });
  expect(screen).toHavePathname(esperada);
});
