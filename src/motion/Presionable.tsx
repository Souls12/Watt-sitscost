import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { curva, dur } from './tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean; checked?: boolean; disabled?: boolean };
  accessibilityRole?: 'button' | 'checkbox';
};

// Respuesta al toque: la tarjeta se hunde un poco (0,97) mientras se presiona. Corre en el hilo de UI.
export function Presionable({ children, style, ...resto }: Props) {
  const e = useSharedValue(1);
  const estilo = useAnimatedStyle(() => ({ transform: [{ scale: e.value }] }));
  return (
    <AnimatedPressable
      {...resto}
      accessibilityRole={resto.accessibilityRole ?? 'button'}
      onPressIn={() => (e.value = withTiming(0.97, { duration: dur.corta, easing: curva.sale }))}
      onPressOut={() => (e.value = withTiming(1, { duration: dur.corta, easing: curva.sale }))}
      style={[style, estilo]}
    >
      {children}
    </AnimatedPressable>
  );
}
