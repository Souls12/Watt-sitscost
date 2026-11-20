import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { almanaque } from '@/theme';

// Ilustración simplificada de una etiqueta de electrodoméstico: resalta dónde leer la potencia.
export function GuiaEtiqueta() {
  const theme = useTheme();
  const linea = (ancho: `${number}%`) => (
    <View style={{ height: 8, width: ancho, borderRadius: 4, backgroundColor: theme.colors.outline }} />
  );
  return (
    <View
      accessible
      accessibilityLabel="Guía: en la etiqueta pegada en la parte trasera o lateral del aparato, busca el número seguido de W o Watts, o de kW si está en kilovatios."
      style={{ borderWidth: 2, borderColor: theme.colors.outline, borderRadius: 12, padding: 12, gap: 8, backgroundColor: theme.colors.surfaceVariant }}
    >
      {linea('55%')}
      {linea('80%')}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          borderWidth: 2,
          borderColor: almanaque.rojo,
          borderRadius: 8,
          padding: 8,
          backgroundColor: theme.colors.surface,
        }}
      >
        <Text variant="labelLarge" style={{ flex: 1 }}>
          Potencia / Power
        </Text>
        <Text variant="titleMedium" style={{ color: almanaque.rojo }}>
          1.200 W
        </Text>
      </View>
      {linea('65%')}
      <Text variant="bodySmall">
        Busca la etiqueta pegada atrás o a un lado del aparato. Lee el número junto a W (vatios). Si dice kW, multiplícalo por 1.000.
      </Text>
    </View>
  );
}
