import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { almanaque } from '@/theme';

// Marcador de posición de cada destino: encabezado amarillo del almanaque, edge-to-edge.
export function Pantalla({ titulo }: { titulo: string }) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ backgroundColor: almanaque.amarillo, paddingTop: insets.top + 16, padding: 16 }}>
        <Text variant="headlineMedium" style={{ color: almanaque.tinta }}>
          {titulo}
        </Text>
      </View>
    </View>
  );
}
