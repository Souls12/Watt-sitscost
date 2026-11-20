import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Snackbar, Text, useTheme } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { CartesianChart, Line } from 'victory-native';
import { Pantalla } from '@/components/Pantalla';
import { useColoresTipo } from '@/lib/aparatos';
import { formatEnergy } from '@/lib/format';
import { rangoSemana, seriesPorAparato, type PuntoAparato, type Semana } from '@/lib/semanas';
import { supabase } from '@/lib/supabase';

const num = (x: unknown) => Number(x);

export default function Semanas() {
  const theme = useTheme();
  const colores = useColoresTipo();
  const [semanas, setSemanas] = useState<Semana[]>([]);
  const [puntos, setPuntos] = useState<PuntoAparato[]>([]);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([supabase.rpc('semanas_periodo'), supabase.rpc('tendencia_aparatos')]).then(([s, t]) => {
        if (s.error || t.error) return setError(true);
        setSemanas(((s.data ?? []) as any[]).map((x) => ({ ...x, kwh: num(x.kwh), presupuesto: num(x.presupuesto) })));
        setPuntos(((t.data ?? []) as any[]).map((x) => ({ ...x, kwh: num(x.kwh) })));
      });
    }, []),
  );

  const hayRegistros = semanas.some((s) => s.kwh > 0);
  const series = seriesPorAparato(semanas, puntos);
  // Una sola escala para todos los aparatos: el máximo semanal de cualquiera.
  const maxY = Math.max(0.1, ...puntos.map((p) => p.kwh));

  return (
    <Pantalla titulo="Semanas">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {!hayRegistros ? (
          <Text variant="bodyLarge">Aún no hay registros en este periodo. Reporta el uso de un aparato y aquí verás cada semana.</Text>
        ) : (
          <>
            {semanas.map((s) => {
              const sobre = s.kwh > s.presupuesto;
              const ancho = Math.min(1, s.presupuesto > 0 ? s.kwh / s.presupuesto : s.kwh > 0 ? 1 : 0);
              return (
                <View
                  key={s.semana}
                  style={{ gap: 4 }}
                  accessible
                  accessibilityLabel={`Semana ${rangoSemana(s.desde, s.hasta)}${s.parcial ? ', parcial' : ''}: ${formatEnergy(s.kwh)} de ${formatEnergy(s.presupuesto)}${sobre ? ', por encima del presupuesto' : ''}`}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text variant="titleSmall">
                      {rangoSemana(s.desde, s.hasta)}
                      {s.parcial ? ' · parcial' : ''}
                      {s.es_actual ? ' · esta semana' : ''}
                    </Text>
                    <Text variant="bodyMedium">
                      {formatEnergy(s.kwh)} de {formatEnergy(s.presupuesto)}
                    </Text>
                  </View>
                  <View style={{ height: 10, borderRadius: 5, backgroundColor: theme.colors.surfaceVariant, overflow: 'hidden' }}>
                    <View style={{ width: `${ancho * 100}%`, height: 10, backgroundColor: sobre ? theme.colors.tertiary : theme.colors.secondary }} />
                  </View>
                  {sobre && <Text variant="labelMedium">Por encima del presupuesto de la semana</Text>}
                </View>
              );
            })}

            <Text variant="titleMedium" style={{ marginTop: 8 }}>
              Tendencia por aparato
            </Text>
            {semanas.length < 2 ? (
              <Text variant="bodyMedium">Aún no hay datos suficientes: las tendencias aparecen cuando hay al menos dos semanas.</Text>
            ) : (
              <>
                <Text variant="bodySmall">Todas las gráficas usan la misma escala (0 a {formatEnergy(maxY)} por semana).</Text>
                {series.map((s) => (
                  <View key={s.aparato_id} style={{ gap: 4 }}>
                    <Text variant="labelLarge">{s.nombre}</Text>
                    <View
                      style={{ height: 90 }}
                      accessible
                      accessibilityLabel={`${s.nombre}: ${s.puntos.map((p, i) => `${rangoSemana(semanas[i].desde, semanas[i].hasta)} ${formatEnergy(p.kwh)}`).join(', ')}`}
                    >
                      <CartesianChart data={s.puntos} xKey="x" yKeys={['kwh']} domain={{ y: [0, maxY] }} domainPadding={{ left: 8, right: 8, top: 4 }}>
                        {({ points }) => <Line points={points.kwh} color={colores[s.tipo] ?? theme.colors.onSurface} strokeWidth={2} />}
                      </CartesianChart>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
      <Snackbar visible={error} onDismiss={() => setError(false)} duration={5000}>
        No pudimos actualizar tus datos. Revisa tu conexión.
      </Snackbar>
    </Pantalla>
  );
}
