import { useEffect, type ReactNode } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { curva, dur } from './tokens';

type Props = { arrancada: boolean; onFin?: () => void; children: ReactNode };

// Cierre del periodo: la hoja gira hacia la izquierda y cae.
export function HojaArrancada({ arrancada, onFin, children }: Props) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (!arrancada) {
      p.value = 0;
      return;
    }
    p.value = withTiming(
      1,
      { duration: dur.hoja, easing: curva.entra },
      (fin) => {
        if (fin && onFin) scheduleOnRN(onFin);
      },
    );
  }, [arrancada, onFin, p]);

  const estilo = useAnimatedStyle(() => ({
    opacity: 1 - Math.max(0, p.value - 0.7) / 0.3,
    transform: [
      { translateX: -140 * p.value },
      { translateY: 520 * p.value * p.value },
      { rotate: `${-18 * p.value}deg` },
    ],
  }));
  return <Animated.View style={estilo}>{children}</Animated.View>;
}
