import { Pressable, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type DestinoRiel = { key: string; titulo: string; icono: string; activo: boolean; alPulsar: () => void };

// Riel de navegación Material 3 (ancho expandido, >= 840 dp): sustituye a la barra inferior.
export function RielNavegacion({ destinos }: { destinos: DestinoRiel[] }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        width: 80 + insets.left,
        paddingLeft: insets.left,
        paddingTop: insets.top + 16,
        gap: 12,
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRightWidth: 1,
        borderRightColor: colors.outline,
      }}
    >
      {destinos.map((d) => (
        <Pressable
          key={d.key}
          accessibilityRole="tab"
          accessibilityState={{ selected: d.activo }}
          accessibilityLabel={d.titulo}
          onPress={d.alPulsar}
          style={{ width: 80, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 4 }}
        >
          <View
            style={{
              width: 56,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: d.activo ? colors.secondaryContainer : 'transparent',
            }}
          >
            <Icon source={d.icono} size={24} color={d.activo ? colors.onSecondaryContainer : colors.onSurfaceVariant} />
          </View>
          <Text variant="labelMedium" style={{ color: d.activo ? colors.onSurface : colors.onSurfaceVariant }}>
            {d.titulo}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
