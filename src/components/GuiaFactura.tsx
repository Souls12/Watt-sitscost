import { View } from 'react-native';
import { SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { useState } from 'react';

type Variante = 'afinia' | 'generica';

// Factura ilustrada: marca en rojo dónde están el consumo facturado (kWh) y las fechas del periodo de consumo.
export function GuiaFactura() {
  const theme = useTheme();
  const [v, setV] = useState<Variante>('afinia');
  const linea = (ancho: `${number}%`) => (
    <View style={{ height: 8, width: ancho, borderRadius: 4, backgroundColor: theme.colors.outline }} />
  );
  const marca = (etiqueta: string, valor: string) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.primary,
        borderRadius: 8,
        padding: 8,
        backgroundColor: theme.colors.surface,
      }}
    >
      <Text variant="labelLarge" style={{ flex: 1 }}>{etiqueta}</Text>
      <Text variant="titleMedium" style={{ color: theme.colors.primary }}>{valor}</Text>
    </View>
  );
  const afinia = v === 'afinia';
  return (
    <View style={{ gap: 8 }}>
      <SegmentedButtons
        value={v}
        onValueChange={(x) => setV(x as Variante)}
        buttons={[
          { value: 'afinia', label: 'Afinia' },
          { value: 'generica', label: 'Otra empresa' },
        ]}
      />
      <View
        accessible
        accessibilityLabel={
          afinia
            ? 'Guía: en la factura de Afinia, en el cuadro de consumo busca "Consumo facturado" en kWh y las fechas "Periodo de consumo", desde y hasta.'
            : 'Guía: en tu factura busca el consumo en kWh del mes y las fechas del periodo de consumo, desde y hasta.'
        }
        style={{ borderWidth: 2, borderColor: theme.colors.outline, borderRadius: 12, padding: 12, gap: 8, backgroundColor: theme.colors.surfaceVariant }}
      >
        <Text variant="titleSmall">{afinia ? 'AFINIA · Factura de energía' : 'Factura de energía'}</Text>
        {linea('70%')}
        {marca(afinia ? 'Periodo de consumo' : 'Fechas de consumo', '2026-09-20 a 2026-10-19')}
        {linea('50%')}
        {marca(afinia ? 'Consumo facturado' : 'Consumo (kWh)', '184 kWh')}
        {linea('60%')}
        <Text variant="bodySmall">
          {afinia
            ? 'En el cuadro "Detalle de consumo" busca el periodo y los kWh facturados. No uses el valor total en pesos.'
            : 'Busca los kWh del mes y las fechas "desde" y "hasta" del consumo. No uses la fecha de pago ni el total en pesos.'}
        </Text>
      </View>
    </View>
  );
}
