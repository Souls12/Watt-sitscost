import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Button, Icon, Text, useTheme } from 'react-native-paper';
import { entra } from '@/motion';

// Pantalla sin datos: dice para qué sirve y ofrece una sola acción directa.
export function EstadoVacio({
  icono,
  titulo,
  texto,
  accion,
  onAccion,
}: {
  icono: string;
  titulo: string;
  texto: string;
  accion: string;
  onAccion: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 12, padding: 16 }}>
      <Animated.View
        entering={entra(0)}
        style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.tertiaryContainer, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon source={icono} size={36} color={theme.colors.onTertiaryContainer} />
      </Animated.View>
      <Animated.View entering={entra(1)} style={{ alignItems: 'center', gap: 8 }}>
        <Text variant="titleLarge" style={{ textAlign: 'center' }} accessibilityRole="header">{titulo}</Text>
        <Text variant="bodyLarge" style={{ textAlign: 'center' }}>{texto}</Text>
      </Animated.View>
      <Animated.View entering={entra(2)} style={{ alignSelf: 'stretch' }}>
        <Button mode="contained" contentStyle={{ height: 52 }} onPress={onAccion}>
          {accion}
        </Button>
      </Animated.View>
    </View>
  );
}
