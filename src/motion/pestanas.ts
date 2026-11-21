import { Easing } from 'react-native';
import { dur } from './tokens';

// Transición entre pestañas: la nueva se desliza desde el lado de su posición en la barra (sentido de lectura),
// en 280 ms con la curva de salida. Se aplica en screenOptions de las pestañas.
export function useTransicionPestanas() {
  return {
    animation: 'shift',
    transitionSpec: { animation: 'timing', config: { duration: dur.media, easing: Easing.bezier(0.2, 0, 0, 1) } },
  } as const;
}
