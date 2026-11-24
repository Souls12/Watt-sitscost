import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ActivityIndicator, Button, Checkbox, HelperText, Modal, Portal, Text, useTheme } from 'react-native-paper';
import { fechaLarga, hoyIso } from '@/lib/fechas';
import { formatDuration } from '@/lib/format';
import { supabase } from '@/lib/supabase';

type Item = { aparato_id: number; nombre: string; horas: number };

// "Mi día normal": toma el último día anterior con reportes manuales y lo reporta para hoy de un toque.
// Sin guardar nada aparte: la rutina es lo que la persona reportó la última vez.
export function HojaRutina({ visible, onCerrar, onListo }: { visible: boolean; onCerrar: () => void; onListo: () => void }) {
  const theme = useTheme();
  const [dia, setDia] = useState<string | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [quitados, setQuitados] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setItems(null);
    setQuitados(new Set());
    setError(null);
    const hoy = hoyIso();
    supabase
      .from('registros_uso')
      .select('fecha, aparato_id, horas, aparato:aparatos!inner(nombre, archivado_en)')
      .eq('origen', 'manual')
      .lt('fecha', hoy)
      .is('aparato.archivado_en', null)
      .order('fecha', { ascending: false })
      .limit(60)
      .then(({ data, error: e }) => {
        if (e) return setError('No pudimos cargar tus reportes. Revisa tu conexión.');
        const filas = (data ?? []) as unknown as { fecha: string; aparato_id: number; horas: number; aparato: { nombre: string } }[];
        const ultimo = filas[0]?.fecha ?? null;
        // Suma por aparato las horas de ese día.
        const m = new Map<number, Item>();
        for (const f of filas.filter((x) => x.fecha === ultimo)) {
          const it = m.get(f.aparato_id) ?? { aparato_id: f.aparato_id, nombre: f.aparato.nombre, horas: 0 };
          it.horas += Number(f.horas);
          m.set(f.aparato_id, it);
        }
        setDia(ultimo);
        setItems([...m.values()]);
      });
  }, [visible]);

  const elegidos = (items ?? []).filter((i) => !quitados.has(i.aparato_id));

  async function reportar() {
    setEnviando(true);
    const { error: e } = await supabase.from('registros_uso').insert(elegidos.map((i) => ({ aparato_id: i.aparato_id, horas: i.horas })));
    setEnviando(false);
    if (e) return setError(e.message);
    onCerrar();
    onListo();
  }

  return (
    <Portal>
      <Modal
        visible={visible}
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
          Repetir mi día
        </Text>
        {!items ? (
          error ? <Text>{error}</Text> : <ActivityIndicator accessibilityLabel="Cargando" />
        ) : !items.length ? (
          <Text variant="bodyLarge">Aún no tienes un día reportado para repetir. Reporta tus aparatos hoy y mañana podrás repetirlo con un toque.</Text>
        ) : (
          <>
            <Text variant="bodyLarge">{`Esto fue lo que reportaste el ${fechaLarga(dia!, false)}. Quita lo que hoy no usaste:`}</Text>
            <ScrollView>
              {items.map((i) => (
                <Checkbox.Item
                  key={i.aparato_id}
                  label={`${i.nombre} · ${formatDuration(i.horas * 60)}`}
                  status={quitados.has(i.aparato_id) ? 'unchecked' : 'checked'}
                  onPress={() =>
                    setQuitados((q) => {
                      const n = new Set(q);
                      n.has(i.aparato_id) ? n.delete(i.aparato_id) : n.add(i.aparato_id);
                      return n;
                    })
                  }
                />
              ))}
            </ScrollView>
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
            <Button mode="contained" contentStyle={{ minHeight: 52 }} disabled={!elegidos.length || enviando} loading={enviando} onPress={reportar}>
              {elegidos.length ? `Reportar ${elegidos.length} ${elegidos.length === 1 ? 'aparato' : 'aparatos'} para hoy` : 'Elige al menos uno'}
            </Button>
          </>
        )}
        <View>
          <Button onPress={onCerrar} contentStyle={{ minHeight: 48 }}>
            Cancelar
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}
