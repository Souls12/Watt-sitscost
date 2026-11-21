import type { ReactNode } from 'react';
import { View } from 'react-native';
import { type Href, router } from 'expo-router';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { encabezado } from '@/theme';

// Encabezado amarillo del almanaque, edge-to-edge, con una acción opcional a la derecha.
// `atras`: muestra la flecha de volver; si no hay pantalla anterior (se abrió directo), va a ese destino.
export function Pantalla({
  titulo,
  derecha,
  atras,
  children,
}: {
  titulo: string;
  derecha?: ReactNode;
  atras?: Href;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          backgroundColor: encabezado.fondo,
          paddingTop: insets.top + 16,
          padding: 16,
          paddingLeft: insets.left + 16,
          paddingRight: insets.right + 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {atras && (
          <IconButton
            icon="arrow-left"
            iconColor={encabezado.texto}
            size={28}
            style={{ marginLeft: -8, marginRight: 4 }}
            accessibilityLabel="Volver"
            onPress={() => (router.canGoBack() ? router.back() : router.replace(atras))}
          />
        )}
        <Text variant="headlineMedium" style={{ color: encabezado.texto, flex: 1 }}>
          {titulo}
        </Text>
        {derecha}
      </View>
      {/* Ancho de lectura: en pantallas anchas el contenido no se estira. */}
      <View style={{ flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' }}>{children}</View>
    </View>
  );
}
