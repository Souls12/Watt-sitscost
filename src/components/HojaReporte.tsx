import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Button, IconButton, List, Modal, Portal, Text, useTheme } from 'react-native-paper';
import { type Aparato, useColoresTipo } from '@/lib/aparatos';
import { aIso } from '@/lib/fechas';
import { formatDuration } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { ordenarPorUso } from '@/lib/uso';

const PASO = 0.5;

// Hoja inferior de reporte: (1) toca "Reportar uso" (2) elige aparato (3) confirma las horas prellenadas.
// Cierra al confirmar; el resultado optimista lo pinta la pantalla.
export function HojaReporte({
  visible,
  onCerrar,
  onReportar,
}: {
  visible: boolean;
  onCerrar: () => void;
  onReportar: (a: Aparato, horas: number) => void;
}) {
  const theme = useTheme();
  const colores = useColoresTipo();
  const [lista, setLista] = useState<Aparato[]>([]);
  const [elegido, setElegido] = useState<Aparato | null>(null);
  const [horas, setHoras] = useState(1);

  useEffect(() => {
    if (!visible) return;
    setElegido(null);
    const desde = aIso(new Date(Date.now() - 30 * 86400000));
    Promise.all([
      supabase.from('aparatos').select('*').is('archivado_en', null).order('creado_en', { ascending: false }),
      supabase.from('registros_uso').select('aparato_id').gte('fecha', desde),
    ]).then(([a, r]) => setLista(ordenarPorUso((a.data ?? []) as Aparato[], r.data ?? [])));
  }, [visible]);

  const elegir = (a: Aparato) => {
    setElegido(a);
    setHoras(a.uso_tipico_horas ?? 1);
  };

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
          maxHeight: '80%',
          width: '100%',
          maxWidth: 560,
          alignSelf: 'center',
        }}
      >
        {!elegido ? (
          <FlatList
            data={lista}
            keyExtractor={(a) => String(a.id)}
            style={{ flexGrow: 0 }}
            ListHeaderComponent={<Text variant="titleLarge">¿Qué usaste?</Text>}
            ListEmptyComponent={<Text style={{ paddingVertical: 16 }}>Primero agrega un aparato en la pestaña Aparatos.</Text>}
            renderItem={({ item: a }) => (
              <List.Item
                title={a.cantidad > 1 ? `${a.nombre} ×${a.cantidad}` : a.nombre}
                description={a.tipo}
                left={() => (
                  <View style={{ width: 6, alignSelf: 'stretch', borderRadius: 3, backgroundColor: colores[a.tipo] ?? theme.colors.outline }} />
                )}
                onPress={() => elegir(a)}
              />
            )}
          />
        ) : (
          <>
            <Text variant="titleLarge">{elegido.nombre}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }}>
              <IconButton icon="minus" style={{ margin: 0, width: 48, height: 48 }} accessibilityLabel="Menos tiempo" disabled={horas <= PASO} onPress={() => setHoras((h) => h - PASO)} />
              <Text variant="headlineMedium" style={{ minWidth: 120, textAlign: 'center' }}>
                {formatDuration(horas * 60)}
              </Text>
              <IconButton icon="plus" style={{ margin: 0, width: 48, height: 48 }} accessibilityLabel="Más tiempo" disabled={horas >= 24} onPress={() => setHoras((h) => h + PASO)} />
            </View>
            <Button
              mode="contained"
              onPress={() => {
                onReportar(elegido, horas);
                onCerrar();
              }}
            >
              Confirmar
            </Button>
          </>
        )}
      </Modal>
    </Portal>
  );
}
