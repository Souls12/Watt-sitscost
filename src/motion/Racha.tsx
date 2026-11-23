import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from 'react-native-paper';
import { Cifra } from './Cifra';
import { resorte } from './tokens';

// Racha: el punto salta hacia arriba con un resorte al subir el número. Sin animación de pérdida: nunca se regaña.
export function Racha({ dias }: { dias: number }) {
  const { colors } = useTheme();
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = -14;
    y.value = withDelay(100, withSpring(0, resorte.racha)); // 100 ms después de la luna y la cifra
  }, [dias, y]);
  const punto = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Animated.View
        style={[{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors.primary }, punto]}
      />
      <Cifra valor={String(dias)} />
    </View>
  );
}
