import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ActivityIndicator, Button, HelperText, IconButton, Modal, Portal, Text, useTheme } from 'react-native-paper';
import { HojaReporte } from '@/components/HojaReporte';
import { IconoTipo } from '@/components/IconoTipo';
import { Nota } from '@/components/Nota';
import { cargarRegistros } from '@/lib/consumo';
import type { Registro } from '@/lib/estadisticas';
import { fechaLarga, hoyIso } from '@/lib/fechas';
import { formatDuration, formatEnergy, formatMoney } from '@/lib/format';
import { supabase } from '@/lib/supabase';

const PASO = 0.5;

// Hoja inferior con lo usado un día: aparato, tiempo, kWh y pesos. Cada registro se puede corregir o borrar,
// y se puede agregar uso a ese día. Las reglas (periodo, máximo 24 h, no futuro) las valida Postgres.
export function DetalleDia({ fecha, onCerrar, onCambio }: { fecha: string | null; onCerrar: () => void; onCambio?: () => void }) {
  const theme = useTheme();
  const [rs, setRs] = useState<Registro[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<{ id: number; horas: number } | null>(null);
  const [borrar, setBorrar] = useState<number | null>(null);
  const [agregando, setAgregando] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(() => {
    if (!fecha) return;
    cargarRegistros(fecha, fecha)
      .then((r) => setRs(r.sort((a, b) => b.kwh - a.kwh)))
      .catch(() => setError('No pudimos cargar este día. Revisa tu conexión.'));
  }, [fecha]);

  useEffect(() => {
    setRs(null);
    setError(null);
    setEditando(null);
    setBorrar(null);
    cargar();
  }, [cargar]);

  // Tras un cambio: recarga la hoja y avisa a la pantalla para que actualice sus cifras.
  async function aplicar(op: PromiseLike<{ error: { message: string } | null }>) {
    setOcupado(true);
    const { error: e } = await op;
    setOcupado(false);
    if (e) return setError(e.message);
    setError(null);
    setEditando(null);
    setBorrar(null);
    cargar();
    onCambio?.();
  }

  const kwh = rs?.reduce((s, f) => s + f.kwh, 0) ?? 0;
  const costo = rs?.reduce((s, f) => s + f.costo, 0) ?? 0;
  const futuro = !!fecha && fecha > hoyIso();

  return (
    <>
    <Portal>
      <Modal
        visible={!!fecha && !agregando}
        onDismiss={onCerrar}
        style={{ justifyContent: 'flex-end', margin: 0 }}
        contentContainerStyle={{
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: 16,
          gap: 12,
          maxHeight: '85%',
          width: '100%',
          maxWidth: 560,
          alignSelf: 'center',
        }}
      >
        <Text variant="titleLarge" accessibilityRole="header">
          {fecha ? fechaLarga(fecha) : ''}
        </Text>
        {!rs ? (
          error ? <Text>{error}</Text> : <ActivityIndicator accessibilityLabel="Cargando" />
        ) : !rs.length ? (
          <Text variant="bodyLarge">{futuro ? 'Este día aún no llega.' : 'Este día no se reportó ningún aparato.'}</Text>
        ) : (
          <>
            <Text variant="titleMedium">{`Total: ${formatEnergy(kwh)} · ${formatMoney(costo)}`}</Text>
            <ScrollView contentContainerStyle={{ gap: 4 }}>
              {rs.map((r) => (
                <View key={r.id} style={{ gap: 4, paddingVertical: 4 }}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                    accessible
                    accessibilityLabel={`${r.nombre}: usado ${formatDuration(r.horas * 60)}, ${formatEnergy(r.kwh)}, ${formatMoney(r.costo)}${r.auto ? ', registrado solo' : ''}`}
                  >
                    <IconoTipo tipo={r.tipo} />
                    <View style={{ flex: 1 }}>
                      <Text variant="titleSmall">{r.nombre}</Text>
                      <Text variant="bodyMedium">{`Usado ${formatDuration(r.horas * 60)}${r.auto ? ' · registrado solo' : ''}`}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text variant="titleSmall">{formatEnergy(r.kwh)}</Text>
                      <Text variant="bodySmall">{formatMoney(r.costo)}</Text>
                    </View>
                  </View>
                  {editando?.id === r.id ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 4 }}>
                      <IconButton icon="minus" accessibilityLabel="Menos tiempo" disabled={editando.horas <= PASO} onPress={() => setEditando({ ...editando, horas: editando.horas - PASO })} />
                      <Text variant="titleMedium" style={{ minWidth: 96, textAlign: 'center' }}>
                        {formatDuration(editando.horas * 60)}
                      </Text>
                      <IconButton icon="plus" accessibilityLabel="Más tiempo" disabled={editando.horas >= 24} onPress={() => setEditando({ ...editando, horas: editando.horas + PASO })} />
                      <Button mode="contained" loading={ocupado} disabled={ocupado} onPress={() => aplicar(supabase.from('registros_uso').update({ horas: editando.horas }).eq('id', r.id))}>
                        Guardar
                      </Button>
                      <Button onPress={() => setEditando(null)}>Cancelar</Button>
                    </View>
                  ) : borrar === r.id ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 4 }}>
                      <Text variant="bodyMedium" style={{ flex: 1 }}>¿Borrar este registro?</Text>
                      <Button mode="contained" buttonColor={theme.colors.error} textColor={theme.colors.onError} loading={ocupado} disabled={ocupado} onPress={() => aplicar(supabase.from('registros_uso').delete().eq('id', r.id))}>
                        Borrar
                      </Button>
                      <Button onPress={() => setBorrar(null)}>Cancelar</Button>
                    </View>
                  ) : r.auto ? null : (
                    // Los registros automáticos (nevera) se recrean solos cada noche: no se corrigen ni borran.
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                      <Button icon="pencil" compact onPress={() => { setBorrar(null); setEditando({ id: r.id, horas: r.horas }); }} accessibilityLabel={`Corregir el tiempo de ${r.nombre}`}>
                        Corregir
                      </Button>
                      <Button icon="delete-outline" compact textColor={theme.colors.error} onPress={() => { setEditando(null); setBorrar(r.id); }} accessibilityLabel={`Borrar ${r.nombre} de este día`}>
                        Borrar
                      </Button>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
            <Nota>≈ calculado con la potencia del aparato y tu tarifa.</Nota>
          </>
        )}
        <HelperText type="error" visible={!!error && !!rs}>
          {error}
        </HelperText>
        {!futuro && (
          <Button mode="outlined" icon="plus" onPress={() => setAgregando(true)} contentStyle={{ minHeight: 48 }}>
            Agregar uso a este día
          </Button>
        )}
        <Button mode="contained-tonal" onPress={onCerrar} contentStyle={{ minHeight: 48 }}>
          Cerrar
        </Button>
      </Modal>
    </Portal>
      <HojaReporte
        visible={agregando}
        onCerrar={() => setAgregando(false)}
        onReportar={(a, horas) => aplicar(supabase.from('registros_uso').insert({ aparato_id: a.id, horas, fecha: fecha! }))}
      />
    </>
  );
}
