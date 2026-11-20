import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { Cifra, HojaArrancada, Luna, Racha } from '@/motion';
import { encabezado } from '@/theme';

// Solo desarrollo: ruta /movimiento para ver cada pieza.
export default function MuestraMovimiento() {
  const [llenado, setLlenado] = useState(0);
  const [n, setN] = useState(1);
  const [dias, setDias] = useState(3);
  const [hoja, setHoja] = useState(false);
  if (!__DEV__) return null;
  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 56, gap: 24 }}>
      <Text variant="titleLarge">Luna</Text>
      <Luna llenado={llenado} size={96} />
      <Button mode="contained" onPress={() => setLlenado(llenado >= 1 ? 0 : llenado + 0.5)}>Llenar</Button>

      <Text variant="titleLarge">Cifra</Text>
      <View style={{ height: 56 }}>
        <Cifra valor={`${(n * 1.37).toFixed(2)} kWh`} />
      </View>
      <Button mode="contained" onPress={() => setN(n + 1)}>Cambiar</Button>

      <Text variant="titleLarge">Racha</Text>
      <Racha dias={dias} />
      <Button mode="contained" onPress={() => setDias(dias + 1)}>Subir racha</Button>

      <Text variant="titleLarge">Hoja de almanaque</Text>
      <HojaArrancada arrancada={hoja}>
        <View style={{ height: 120, backgroundColor: encabezado.fondo, padding: 16 }}>
          <Text variant="headlineMedium" style={{ color: encabezado.texto }}>Noviembre</Text>
        </View>
      </HojaArrancada>
      <Button mode="contained" onPress={() => setHoja(!hoja)}>{hoja ? 'Restaurar' : 'Arrancar'}</Button>
    </ScrollView>
  );
}
