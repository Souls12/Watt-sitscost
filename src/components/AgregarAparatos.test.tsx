import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { AgregarAparatos } from '@/components/AgregarAparatos';

// Respuesta del servidor al archivar: la prueba decide cuándo llega.
let mockResolverUpdate: ((v: { error: null }) => void) | null = null;
// Cliente de Supabase simulado: cada consulta encadenada devuelve lo que corresponde a su tabla.
jest.mock('@/lib/supabase', () => {
  const resultado = (tabla: string, op: string) => {
    if (tabla === 'aparatos' && op === 'update') return new Promise((r) => { mockResolverUpdate = r; });
    if (tabla === 'aparatos') return Promise.resolve({ data: [{ id: 7, tipo: 'Ventilador' }], error: null });
    if (tabla === 'aparatos_referencia')
      return Promise.resolve({ data: [{ id: 50, tipo: 'Ventilador', marca: 'Samurai', modelo: 'Eole', potencia_w: 40 }], error: null });
    return Promise.resolve({ data: [], error: null });
  };
  const consulta = (tabla: string) => {
    let op = 'select';
    const q: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'is', 'order', 'single']) q[m] = () => q;
    q.insert = () => ((op = 'insert'), q);
    q.update = () => ((op = 'update'), q);
    q.then = (ok: (v: unknown) => unknown, mal: (e: unknown) => unknown) => resultado(tabla, op).then(ok, mal);
    return q;
  };
  return { supabase: { from: consulta } };
});
jest.mock('expo-router', () => {
  const React = require('react');
  return { router: { push: jest.fn() }, useFocusEffect: (cb: () => void) => React.useEffect(() => cb(), [cb]) };
});
// La animación de entrada y el efecto de presión no afectan cuándo se recarga la lista.
jest.mock('react-native-reanimated', () => ({ __esModule: true, default: { View: require('react-native').View } }));
jest.mock('@/motion', () => {
  const { Pressable } = require('react-native');
  return { Presionable: Pressable, entra: () => undefined };
});

// Defecto encontrado en el CP-14: quitar el ventilador desde la cuadrícula no lo quitaba de "Tus aparatos",
// porque la lista se recargaba antes de que el servidor archivara el aparato.
test('al quitar un aparato, la lista se recarga solo cuando el servidor ya lo archivó', async () => {
  const onGuardado = jest.fn();
  await render(
    <PaperProvider>
      <AgregarAparatos onGuardado={onGuardado} />
    </PaperProvider>,
  );
  const tarjeta = await screen.findByLabelText('Ventilador, 40 W');
  await waitFor(() => expect(tarjeta.props.accessibilityState.checked).toBe(true));

  const toque = fireEvent.press(tarjeta); // sin esperar: el manejador espera al servidor, que aún no responde
  await waitFor(() => expect(mockResolverUpdate).not.toBeNull()); // la app ya pidió archivar el aparato
  expect(onGuardado).not.toHaveBeenCalled(); // el servidor aún no responde: recargar ahora traería el aparato

  await act(async () => mockResolverUpdate!({ error: null }));
  await toque;
  await waitFor(() => expect(onGuardado).toHaveBeenCalledTimes(1));
});
