import { Pressable, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { CartesianChart, Line, Pie, PolarChart } from 'victory-native';
import { formatEnergy, formatMoney } from '@/lib/format';

export type Columna = { clave: string; etiqueta: string; kwh: number | null; meta: number | null; hablado: string };

// Columnas verticales (semanas o días) con la meta marcada como línea punteada.
// Pasarse lleva ícono de alerta además del color; null = día sin datos aún (futuro).
export function Columnas({ columnas, seleccion, onPress }: { columnas: Columna[]; seleccion?: string; onPress?: (clave: string) => void }) {
  const { colors } = useTheme();
  const max = Math.max(0.1, ...columnas.map((c) => Math.max(c.kwh ?? 0, c.meta ?? 0)));
  const ALTO = 140;
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-end' }}>
      {columnas.map((c) => {
        const sobre = c.kwh !== null && c.meta !== null && c.kwh > c.meta;
        const sel = seleccion === c.clave;
        return (
          <Pressable
            key={c.clave}
            onPress={() => onPress?.(c.clave)}
            disabled={!onPress}
            accessibilityRole={onPress ? 'button' : undefined}
            accessibilityState={onPress ? { selected: sel } : undefined}
            accessibilityLabel={c.hablado}
            style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 4, opacity: pressed ? 0.6 : 1, minHeight: 48 })}
          >
            <Text variant="labelSmall" numberOfLines={1}>
              {c.kwh === null ? '–' : formatEnergy(c.kwh).replace(' kWh', '')}
            </Text>
            <View style={{ height: ALTO, width: '100%', justifyContent: 'flex-end' }}>
              {c.meta !== null && (
                <View
                  style={{
                    position: 'absolute',
                    left: -3,
                    right: -3,
                    bottom: (c.meta / max) * ALTO,
                    borderTopWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: colors.onSurfaceVariant,
                  }}
                />
              )}
              <View
                style={{
                  height: Math.max(c.kwh ? 3 : 0, ((c.kwh ?? 0) / max) * ALTO),
                  borderTopLeftRadius: 6,
                  borderTopRightRadius: 6,
                  backgroundColor: sobre ? colors.tertiary : colors.secondary,
                  borderWidth: sel ? 3 : 0,
                  borderColor: colors.primary,
                }}
              />
            </View>
            <View style={{ height: 16 }}>{sobre && <Icon source="alert" size={16} color={colors.tertiary} />}</View>
            <Text variant="labelMedium" style={{ fontWeight: sel ? '700' : '400', textAlign: 'center' }} numberOfLines={2}>
              {c.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Leyenda para las columnas: no depende solo del color.
export function LeyendaColumnas({ conMeta }: { conMeta: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {conMeta && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 16, borderTopWidth: 2, borderStyle: 'dashed', borderColor: colors.onSurfaceVariant }} />
          <Text variant="labelMedium">Meta</Text>
        </View>
      )}
      {conMeta && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon source="alert" size={16} color={colors.tertiary} />
          <Text variant="labelMedium">Se pasó de la meta</Text>
        </View>
      )}
    </View>
  );
}

export type FilaRanking = { clave: string; nombre: string; kwh: number; detalle: string; color: string; extra?: string };

// Barras horizontales ordenadas de mayor a menor, con kWh, % del total y un detalle (pesos u horas).
export function Ranking({ filas }: { filas: FilaRanking[] }) {
  const { colors } = useTheme();
  const total = filas.reduce((s, f) => s + f.kwh, 0);
  const max = Math.max(0.001, ...filas.map((f) => f.kwh));
  return (
    <View style={{ gap: 10 }}>
      {filas.map((f) => {
        const pct = total > 0 ? Math.round((f.kwh / total) * 100) : 0;
        return (
          <View
            key={f.clave}
            accessible
            accessibilityLabel={`${f.nombre}: ${formatEnergy(f.kwh)}, ${pct} por ciento del total, ${f.detalle}${f.extra ? `, ${f.extra}` : ''}`}
            style={{ gap: 4 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text variant="titleSmall" style={{ flex: 1 }} numberOfLines={1}>
                {f.nombre}
              </Text>
              <Text variant="titleSmall">{`${formatEnergy(f.kwh)} · ${pct} %`}</Text>
            </View>
            <View style={{ height: 12, borderRadius: 6, backgroundColor: colors.surfaceVariant, overflow: 'hidden' }}>
              <View style={{ width: `${(f.kwh / max) * 100}%`, height: 12, backgroundColor: f.color }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="bodySmall">{f.detalle}</Text>
              {f.extra && <Text variant="bodySmall">{f.extra}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// Línea de lo gastado acumulado día a día contra la meta acumulada (recta). real null = día futuro.
export function Acumulado({ puntos, hablado }: { puntos: { dia: number; real: number | null; meta: number | null }[]; hablado: string }) {
  const { colors } = useTheme();
  const tieneMeta = puntos.some((p) => p.meta !== null);
  return (
    <View style={{ gap: 6 }}>
      <View style={{ height: 160 }} accessible accessibilityLabel={hablado}>
        <CartesianChart data={puntos} xKey="dia" yKeys={['real', 'meta']} domainPadding={{ top: 8, left: 4, right: 4 }}>
          {({ points }) => (
            <>
              {tieneMeta && <Line points={points.meta} color={colors.onSurfaceVariant} strokeWidth={2} />}
              <Line points={points.real} color={colors.primary} strokeWidth={4} />
            </>
          )}
        </CartesianChart>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 16, height: 4, backgroundColor: colors.primary }} />
          <Text variant="labelMedium">Lo que llevas</Text>
        </View>
        {tieneMeta && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 16, height: 2, backgroundColor: colors.onSurfaceVariant }} />
            <Text variant="labelMedium">Meta</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// Dona con el reparto por tipo de aparato; la leyenda lleva el % para no depender del color.
export function Dona({ datos, costo }: { datos: { tipo: string; kwh: number; color: string }[]; costo: number }) {
  const total = datos.reduce((s, d) => s + d.kwh, 0);
  const pct = (k: number) => (total > 0 ? Math.round((k / total) * 100) : 0);
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
      accessible
      accessibilityLabel={`Reparto por tipo: ${datos.map((d) => `${d.tipo} ${pct(d.kwh)} por ciento`).join(', ')}`}
    >
      <View style={{ width: 130, height: 130, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', inset: 0 }}>
          <PolarChart data={datos} labelKey="tipo" valueKey="kwh" colorKey="color">
            <Pie.Chart innerRadius="62%" />
          </PolarChart>
        </View>
        <Text variant="titleSmall">{formatEnergy(total)}</Text>
        <Text variant="labelSmall">{formatMoney(costo)}</Text>
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        {datos.map((d) => (
          <View key={d.tipo} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: d.color }} />
            <Text variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
              {d.tipo}
            </Text>
            <Text variant="bodyMedium">{`${pct(d.kwh)} %`}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
