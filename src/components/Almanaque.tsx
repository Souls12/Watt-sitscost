import { Pressable, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Luna } from '@/motion';
import { fechaLarga } from '@/lib/fechas';
import type { DiaAlmanaque } from '@/lib/usePanelUso';

const LETRAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const lunes = (iso: string) => (new Date(iso + 'T12:00:00Z').getUTCDay() + 6) % 7;

const hablado = (d: DiaAlmanaque) =>
  [
    fechaLarga(d.fecha, false),
    d.es_hoy && 'hoy',
    d.reportado ? 'con uso reportado' : 'sin reporte',
    `${Math.round(d.fraccion * 100)} por ciento del presupuesto gastado`,
  ]
    .filter(Boolean)
    .join(', ');

// Cuadrícula L–D del periodo: cada día es una luna que se llena con lo gastado; hoy en rojo; punto = día reportado.
// Tocar un día abre sus aparatos (onDia).
export function Almanaque({ dias, onDia }: { dias: DiaAlmanaque[]; onDia?: (fecha: string) => void }) {
  const { colors } = useTheme();
  if (!dias.length) return null;
  const celdas: (DiaAlmanaque | null)[] = [...Array(lunes(dias[0].fecha)).fill(null), ...dias];
  while (celdas.length % 7) celdas.push(null);
  const filas = Array.from({ length: celdas.length / 7 }, (_, i) => celdas.slice(i * 7, i * 7 + 7));
  return (
    <View style={{ gap: 4 }} accessibilityLabel="Almanaque del periodo">
      <View style={{ flexDirection: 'row' }}>
        {LETRAS.map((l, i) => (
          <Text key={i} variant="labelMedium" style={{ flex: 1, textAlign: 'center' }}>
            {l}
          </Text>
        ))}
      </View>
      {filas.map((f, i) => (
        <View key={i} style={{ flexDirection: 'row' }}>
          {f.map((d, j) => (
            <Pressable
              key={j}
              disabled={!d || !onDia}
              onPress={() => d && onDia?.(d.fecha)}
              accessibilityRole={d && onDia ? 'button' : undefined}
              accessibilityHint={d && onDia ? 'Muestra los aparatos usados ese día' : undefined}
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                flex: 1,
                aspectRatio: 1,
                margin: 2,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: d?.es_hoy ? 2 : d ? 1 : 0,
                borderColor: d?.es_hoy ? colors.primary : colors.outline,
                borderRadius: 6,
              })}
              accessible={!!d}
              importantForAccessibility={d ? 'yes' : 'no-hide-descendants'}
              accessibilityLabel={d ? hablado(d) : undefined}
            >
              {d && (
                <>
                  <Text variant="labelSmall" style={{ position: 'absolute', top: 1, left: 3 }}>
                    {Number(d.fecha.slice(8))}
                  </Text>
                  <Luna llenado={d.fraccion} size={26} color={d.fraccion >= 1 ? colors.tertiary : colors.secondary} borde={colors.outline} />
                  {d.reportado && (
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 2,
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: colors.onSurface,
                      }}
                    />
                  )}
                </>
              )}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}
