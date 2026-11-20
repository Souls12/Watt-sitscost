import { useEffect, useMemo } from 'react';
import { Canvas, Circle, Group, Rect, Skia } from '@shopify/react-native-skia';
import { useDerivedValue, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { almanaque } from '@/theme';
import { curva, dur } from './tokens';

type Props = { llenado: number; size?: number; color?: string; borde?: string };

// Luna del día: el relleno sube desde abajo, como llenar un vaso. Con quitar animaciones, corte instantáneo.
export function Luna({ llenado, size = 64, color = almanaque.amarillo, borde = '#CFC8B8' }: Props) {
  const reducir = useReducedMotion();
  const v = useSharedValue(Math.min(1, Math.max(0, llenado)));
  useEffect(() => {
    const destino = Math.min(1, Math.max(0, llenado));
    v.value = reducir ? destino : withTiming(destino, { duration: dur.luna, easing: curva.sale });
  }, [llenado, reducir, v]);

  const r = size / 2 - 2;
  // Un rrect con radio = mitad del lado es un círculo.
  const clip = useMemo(() => Skia.RRectXY(Skia.XYWHRect(2, 2, size - 4, size - 4), r, r), [size, r]);
  const y = useDerivedValue(() => size - 2 - (size - 4) * v.value);

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group clip={clip}>
        <Rect x={0} y={y} width={size} height={size} color={color} />
      </Group>
      <Circle cx={size / 2} cy={size / 2} r={r} color={borde} style="stroke" strokeWidth={2} />
    </Canvas>
  );
}
