import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from 'react-native-paper';
import { Cifra } from './Cifra';
import { dur, resorte } from './tokens';

// Racha: el punto salta hacia arriba con un resorte al subir el número. Sin animación de pérdida: nunca se regaña.
export function Racha({ dias }: { dias: number }) {
  const { colors } = useTheme();
  const reducir = useReducedMotion();
  const y = useSharedValue(0);
  const o = useSharedValue(1);
  useEffect(() => {
    if (reducir) {
      o.value = 0.4;
      o.value = withTiming(1, { duration: dur.corta });
      return;
    }
    y.value = -14;
    y.value = withSpring(0, resorte.racha);
  }, [dias, reducir, y, o]);
  const punto = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: o.value }));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 56 }}>
      <Animated.View
        style={[{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors.primary }, punto]}
      />
      <Cifra valor={String(dias)} />
    </View>
  );
}
