import { useReducedMotion } from 'react-native-reanimated';

// Transición entre pestañas: la nueva se desliza desde el lado de su posición en la barra (sentido de lectura).
// Con quitar animaciones, corte instantáneo. Se aplica en screenOptions de las pestañas.
export function useTransicionPestanas() {
  const reducir = useReducedMotion();
  return reducir ? ({ animation: 'none' } as const) : ({ animation: 'shift' } as const);
}
