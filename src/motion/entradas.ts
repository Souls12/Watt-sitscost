import { FadeInDown, FadeInLeft, FadeInRight, FadeOutLeft, FadeOutRight } from 'react-native-reanimated';
import { curva, dur } from './tokens';

// Entradas escalonadas: cada elemento llega un poco después del anterior (60 ms), subiendo y asentándose.
// Todo corre en el hilo de UI (layout animations). Máximo 6 escalones para que nada tarde en aparecer.
export const entra = (i = 0) => FadeInDown.delay(Math.min(i, 6) * 60).duration(dur.media).easing(curva.sale);

// Cambio de página (bienvenida): avanzar entra desde la derecha y la anterior sale hacia la izquierda; retroceder, al revés.
export const paginaEntra = (adelante: boolean) =>
  (adelante ? FadeInRight : FadeInLeft).duration(dur.media).easing(curva.sale);
export const paginaSale = (adelante: boolean) =>
  (adelante ? FadeOutLeft : FadeOutRight).duration(dur.corta).easing(curva.entra);
