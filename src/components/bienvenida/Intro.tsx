import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Button, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { entra, paginaEntra, paginaSale } from '@/motion';
import { encabezado } from '@/theme';
import { IlustracionCalculo, IlustracionMeta, IlustracionQueHace } from './Ilustraciones';

const PAGINAS = [
  {
    Ilustracion: IlustracionQueHace,
    titulo: 'Entiende cuánta energía gastas',
    texto: "Watt'sitcost te muestra cuántos kilovatios hora (kWh) gastas en casa y cuánto cuestan, día a día. Sin cuentas complicadas.",
  },
  {
    Ilustracion: IlustracionCalculo,
    titulo: 'Así calculamos el costo',
    texto:
      'Multiplicamos la potencia del aparato por las horas que lo usas, y eso por lo que cuesta cada kWh en tu tarifa. Es un cálculo aproximado: tu factura puede variar un poco.',
  },
  {
    Ilustracion: IlustracionMeta,
    titulo: 'Una meta, un día a la vez',
    texto:
      'Con tu factura anterior fijas una meta de ahorro. Cada día te decimos cuánto puedes gastar, y cada luna que se llena es un día reportado. Si un día te pasas, no pasa nada: sigues.',
  },
];

// Tres pantallas cortas: qué hace la app, cómo se calcula el costo y cómo funcionan la meta y el presupuesto.
export function Intro({ onTerminar }: { onTerminar: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const [adelante, setAdelante] = useState(true);
  const { Ilustracion, titulo, texto } = PAGINAS[i];
  const ultima = i === PAGINAS.length - 1;

  const ir = (n: number) => {
    setAdelante(n > i);
    setI(n);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1, overflow: 'hidden' }}>
        {/* La página entera cambia con `key`: sale hacia un lado y la nueva entra desde el otro. */}
        <Animated.View key={i} entering={paginaEntra(adelante)} exiting={paginaSale(adelante)} style={{ flex: 1 }}>
          <ScrollView>
          <View
            style={{
              backgroundColor: encabezado.fondo,
              paddingTop: insets.top + 64,
              paddingBottom: 32,
              minHeight: 340,
              justifyContent: 'center',
            }}
          >
            <Ilustracion />
          </View>
          <View style={{ padding: 24, gap: 12, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
            <Animated.Text entering={entra(1)} accessibilityRole="header" style={[theme.fonts.headlineMedium, { color: theme.colors.onBackground }]}>
              {titulo}
            </Animated.Text>
            <Animated.Text entering={entra(2)} style={[theme.fonts.bodyLarge, { color: theme.colors.onSurfaceVariant }]}>
              {texto}
            </Animated.Text>
          </View>
          </ScrollView>
        </Animated.View>
        <View style={{ position: 'absolute', top: insets.top + 8, right: 8 }}>
          <Button
            textColor={encabezado.texto}
            contentStyle={{ minHeight: 48, paddingHorizontal: 8 }}
            onPress={onTerminar}
            accessibilityLabel="Saltar la presentación"
          >
            Saltar
          </Button>
        </View>
      </View>

      <View style={{ padding: 24, paddingBottom: insets.bottom + 24, gap: 20, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
        <View
          accessible
          accessibilityLabel={`Página ${i + 1} de ${PAGINAS.length}`}
          style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}
        >
          {PAGINAS.map((_, n) => (
            <View
              key={n}
              style={{
                height: 10,
                width: n === i ? 28 : 10,
                borderRadius: 5,
                backgroundColor: n === i ? theme.colors.primary : theme.colors.outline,
              }}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {i > 0 && (
            <Button mode="outlined" style={{ flex: 1 }} contentStyle={{ height: 56 }} onPress={() => ir(i - 1)}>
              Atrás
            </Button>
          )}
          <Button
            mode="contained"
            style={{ flex: 2 }}
            contentStyle={{ height: 56 }}
            labelStyle={{ fontSize: 18 }}
            onPress={() => (ultima ? onTerminar() : ir(i + 1))}
          >
            {ultima ? 'Empezar' : 'Siguiente'}
          </Button>
        </View>
      </View>
    </View>
  );
}
