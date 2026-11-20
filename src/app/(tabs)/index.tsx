import { useEffect } from 'react';
import { View } from 'react-native';
import { Canvas, Circle } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { Pantalla } from '@/components/Pantalla';
import { almanaque } from '@/theme';

// Humo de Reanimated + Skia: una luna que se llena. El ticket del movimiento la reemplaza.
export default function Mes() {
  const fill = useSharedValue(0);
  useEffect(() => {
    fill.value = withTiming(1, { duration: 400 });
  }, [fill]);
  const r = useDerivedValue(() => 28 * fill.value);
  return (
    <View style={{ flex: 1 }}>
      <Pantalla titulo="Mes" />
      <Canvas style={{ width: 64, height: 64, margin: 16 }}>
        <Circle cx={32} cy={32} r={28} color="#CFC8B8" style="stroke" strokeWidth={2} />
        <Circle cx={32} cy={32} r={r} color={almanaque.amarillo} />
      </Canvas>
    </View>
  );
}
