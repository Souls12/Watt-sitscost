import { View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';

// Nota discreta y en línea que explica una suposición o estimación de la app; nunca interrumpe.
export function Nota({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
      <View style={{ paddingTop: 2 }}>
        <Icon source="information-outline" size={16} color={theme.colors.onSurfaceVariant} />
      </View>
      <Text variant="bodySmall" style={{ flex: 1, color: theme.colors.onSurfaceVariant }}>{children}</Text>
    </View>
  );
}
