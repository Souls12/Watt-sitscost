import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Icon, Text, useTheme } from 'react-native-paper';
import { IconoTipo } from '@/components/IconoTipo';
import { TIPOS_COMUNES, referenciaTipica } from '@/lib/bienvenida';
import { formatDuration, formatPower } from '@/lib/format';
import { Presionable, entra } from '@/motion';

type Ficha = { id: number; tipo: string; potencia_w: number };

// Cuadrícula de aparatos comunes: un toque agrega (o quita) el aparato con potencia y uso típicos.
export function GridComunes({
  fichas,
  agregados,
  ocupado,
  onAlternar,
}: {
  fichas: Ficha[];
  agregados: Record<string, number>;
  ocupado: string | null;
  onAlternar: (t: (typeof TIPOS_COMUNES)[number]) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {TIPOS_COMUNES.map((t, i) => {
        const puesto = !!agregados[t.tipo];
        const ficha = referenciaTipica(fichas, t.tipo);
        const tinta = puesto ? theme.colors.onPrimaryContainer : theme.colors.onSurface;
        return (
          <Animated.View key={t.tipo} entering={entra(i)} style={{ flexBasis: '47%', flexGrow: 1 }}>
            <Presionable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: puesto, disabled: ocupado === t.tipo }}
              accessibilityLabel={`${t.nombre}${ficha ? `, ${formatPower(ficha.potencia_w)}` : ''}`}
              disabled={ocupado !== null}
              onPress={() => onAlternar(t)}
              style={{
                minHeight: 120,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: puesto ? theme.colors.primary : theme.colors.outline,
                backgroundColor: puesto ? theme.colors.primaryContainer : theme.colors.surface,
                padding: 12,
                gap: 4,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <IconoTipo tipo={t.tipo} size={32} />
                {puesto && <Icon source="check-circle" size={24} color={theme.colors.onPrimaryContainer} />}
              </View>
              <Text variant="titleSmall" style={{ color: tinta }}>
                {t.nombre}
              </Text>
              {ficha && (
                <Text variant="bodySmall" style={{ color: puesto ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}>
                  {`${formatPower(ficha.potencia_w)} · ${formatDuration(t.horas * 60)} al día`}
                </Text>
              )}
            </Presionable>
          </Animated.View>
        );
      })}
    </View>
  );
}
