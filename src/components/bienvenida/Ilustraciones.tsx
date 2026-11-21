import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Icon, Text } from 'react-native-paper';
import { Luna, entra } from '@/motion';
import { almanaque } from '@/theme';

// Ilustraciones de la bienvenida, dibujadas con View y Skia (sin imágenes). Van sobre el amarillo del
// encabezado, que es un par fijo con la tinta en ambos temas: por eso usan los colores fijos del almanaque.
const BLANCO = '#FFFFFF';

const Decorativa = ({ children }: { children: React.ReactNode }) => (
  <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ alignItems: 'center' }}>
    {children}
  </View>
);

// 1. Qué hace la app: una luna que se llena con el consumo del día.
export function IlustracionQueHace() {
  const [llenado, setLlenado] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setLlenado(0.65), 350);
    return () => clearTimeout(t);
  }, []);
  return (
    <Decorativa>
      <Luna llenado={llenado} size={150} color={almanaque.verde} borde={almanaque.tinta} />
      <Animated.View entering={entra(2)} style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        {(['lightbulb-outline', 'television', 'fridge'] as const).map((i) => (
          <View key={i} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: BLANCO, alignItems: 'center', justifyContent: 'center' }}>
            <Icon source={i} size={26} color={almanaque.tinta} />
          </View>
        ))}
      </Animated.View>
    </Decorativa>
  );
}

const Ficha = ({ icono, texto, i }: { icono: string; texto: string; i: number }) => (
  <Animated.View
    entering={entra(i)}
    style={{ width: 92, paddingVertical: 12, borderRadius: 16, backgroundColor: BLANCO, alignItems: 'center', gap: 4 }}
  >
    <Icon source={icono} size={30} color={almanaque.tinta} />
    <Text variant="labelLarge" style={{ color: almanaque.tinta }}>{texto}</Text>
  </Animated.View>
);

const Signo = ({ s, i }: { s: string; i: number }) => (
  <Animated.Text entering={entra(i)} style={{ color: almanaque.tinta, fontSize: 28, fontFamily: 'ZillaSlab_700Bold' }}>{s}</Animated.Text>
);

// 2. Cómo se calcula: potencia x horas = kWh; kWh x tarifa = pesos.
export function IlustracionCalculo() {
  return (
    <Decorativa>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ficha i={0} icono="flash" texto="Potencia" />
        <Signo i={1} s="×" />
        <Ficha i={2} icono="clock-outline" texto="Horas" />
      </View>
      <Animated.Text entering={entra(3)} style={{ color: almanaque.tinta, fontSize: 28, fontFamily: 'ZillaSlab_700Bold', marginVertical: 4 }}>
        = kWh
      </Animated.Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ficha i={4} icono="meter-electric-outline" texto="kWh" />
        <Signo i={5} s="×" />
        <Ficha i={6} icono="cash" texto="Tarifa" />
      </View>
    </Decorativa>
  );
}

// 3. Meta y presupuesto diario: una semana de lunas y la barra del presupuesto.
export function IlustracionMeta() {
  const dias = [1, 0.8, 0.5, 1, 0.3, 0.6, 0];
  return (
    <Decorativa>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {dias.map((f, i) => (
          <Animated.View key={i} entering={entra(i)}>
            <Luna llenado={f} size={34} color={almanaque.verde} borde={i === 6 ? almanaque.rojo : almanaque.tinta} />
          </Animated.View>
        ))}
      </View>
      <Animated.View entering={entra(7)} style={{ width: 260, marginTop: 20, gap: 6 }}>
        <Text variant="labelLarge" style={{ color: almanaque.tinta }}>Hoy puedes gastar</Text>
        <View style={{ height: 14, borderRadius: 7, backgroundColor: BLANCO, overflow: 'hidden' }}>
          <View style={{ width: '58%', height: 14, backgroundColor: almanaque.verde }} />
        </View>
      </Animated.View>
    </Decorativa>
  );
}
