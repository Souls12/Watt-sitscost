import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { FAB, IconButton, Snackbar, Text } from 'react-native-paper';
import { HojaReporte } from '@/components/HojaReporte';
import { Pantalla } from '@/components/Pantalla';
import { formatEnergy, formatMoney } from '@/lib/format';
import { usePanelUso } from '@/lib/usePanelUso';
import { Cifra, Racha } from '@/motion';
import { almanaque } from '@/theme';

// Mes: consumo calculado del mes y racha, con el reporte de uso en 3 toques. El ticket del periodo lo completa.
export default function Mes() {
  const { panel, cargar, reportar } = usePanelUso();
  const [abierta, setAbierta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  return (
    <View style={{ flex: 1 }}>
      <Pantalla
        titulo="Mes"
        derecha={
          <IconButton
            icon="account-circle"
            iconColor={almanaque.tinta}
            accessibilityLabel="Mi cuenta"
            onPress={() => router.push('/cuenta')}
          />
        }
      >
        <View style={{ padding: 16, gap: 8 }}>
          <Text variant="labelLarge">Consumo calculado del mes</Text>
          <Cifra valor={formatEnergy(panel.kwh)} />
          <Text>{formatMoney(panel.costo)}</Text>
          <Text variant="labelLarge" style={{ marginTop: 16 }}>
            Racha
          </Text>
          <Racha dias={panel.racha} />
        </View>
      </Pantalla>
      <FAB
        icon="plus"
        label="Reportar uso"
        style={{ position: 'absolute', right: 16, bottom: 16, backgroundColor: almanaque.rojo }}
        color="#FFFFFF"
        onPress={() => setAbierta(true)}
      />
      <HojaReporte
        visible={abierta}
        onCerrar={() => setAbierta(false)}
        onReportar={async (a, h) => setError(await reportar(a, h))}
      />
      <Snackbar visible={!!error} onDismiss={() => setError(null)} duration={5000}>
        {error}
      </Snackbar>
    </View>
  );
}
