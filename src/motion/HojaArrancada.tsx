import { useEffect, type ReactNode } from 'react';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { curva, dur } from './tokens';

type Props = { arrancada: boolean; onFin?: () => void; children: ReactNode };

// Cierre del periodo: la hoja gira hacia la izquierda y cae. Con quitar animaciones, simple fundido.
export function HojaArrancada({ arrancada, onFin, children }: Props) {
  const reducir = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (!arrancada) {
      p.value = 0;
      return;
    }
    p.value = withTiming(
      1,
      { duration: reducir ? dur.corta : dur.hoja, easing: reducir ? curva.transforma : curva.entra },
      (fin) => {
        if (fin && onFin) scheduleOnRN(onFin);
      },
    );
  }, [arrancada, reducir, onFin, p]);

  const estilo = useAnimatedStyle(() =>
    reducir
      ? { opacity: 1 - p.value }
      : {
          opacity: 1 - Math.max(0, p.value - 0.7) / 0.3,
          transform: [
            { translateX: -140 * p.value },
            { translateY: 520 * p.value * p.value },
            { rotate: `${-18 * p.value}deg` },
          ],
        },
  );
  return <Animated.View style={estilo}>{children}</Animated.View>;
}
