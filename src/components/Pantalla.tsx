import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { almanaque } from '@/theme';

// Encabezado amarillo del almanaque, edge-to-edge, con una acción opcional a la derecha.
export function Pantalla({
  titulo,
  derecha,
  children,
}: {
  titulo: string;
  derecha?: ReactNode;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          backgroundColor: almanaque.amarillo,
          paddingTop: insets.top + 16,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text variant="headlineMedium" style={{ color: almanaque.tinta, flex: 1 }}>
          {titulo}
        </Text>
        {derecha}
      </View>
      {children}
    </View>
  );
}
