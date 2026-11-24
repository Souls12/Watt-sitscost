import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ActivityIndicator, Button, Modal, Portal, Text, useTheme } from 'react-native-paper';
import { IconoTipo } from '@/components/IconoTipo';
import { Nota } from '@/components/Nota';
import { cargarRegistros } from '@/lib/consumo';
import { porAparato, type FilaAparato } from '@/lib/estadisticas';
import { fechaLarga } from '@/lib/fechas';
import { formatDuration, formatEnergy, formatMoney } from '@/lib/format';

// Hoja inferior con los aparatos usados un día: cuánto tiempo, kWh y pesos.
export function DetalleDia({ fecha, onCerrar }: { fecha: string | null; onCerrar: () => void }) {
  const theme = useTheme();
  const [filas, setFilas] = useState<FilaAparato[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!fecha) return;
    setFilas(null);
    setError(false);
    cargarRegistros(fecha, fecha)
      .then((rs) => setFilas(porAparato(rs, { desde: fecha, hasta: fecha })))
      .catch(() => setError(true));
  }, [fecha]);

  const kwh = filas?.reduce((s, f) => s + f.kwh, 0) ?? 0;
  const costo = filas?.reduce((s, f) => s + f.costo, 0) ?? 0;

  return (
    <Portal>
      <Modal
        visible={!!fecha}
        onDismiss={onCerrar}
        style={{ justifyContent: 'flex-end', margin: 0 }}
        contentContainerStyle={{
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: 16,
          gap: 12,
          maxHeight: '80%',
          width: '100%',
          maxWidth: 560,
          alignSelf: 'center',
        }}
      >
        <Text variant="titleLarge" accessibilityRole="header">
          {fecha ? fechaLarga(fecha) : ''}
        </Text>
        {error ? (
          <Text>No pudimos cargar este día. Revisa tu conexión.</Text>
        ) : !filas ? (
          <ActivityIndicator accessibilityLabel="Cargando" />
        ) : !filas.length ? (
          <Text variant="bodyLarge">Este día no se reportó ningún aparato.</Text>
        ) : (
          <>
            <Text variant="titleMedium">{`Total: ${formatEnergy(kwh)} · ${formatMoney(costo)}`}</Text>
            <ScrollView contentContainerStyle={{ gap: 8 }}>
              {filas.map((f) => (
                <View
                  key={f.aparato_id}
                  accessible
                  accessibilityLabel={`${f.nombre}: usado ${formatDuration(f.horas * 60)}, ${formatEnergy(f.kwh)}, ${formatMoney(f.costo)}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}
                >
                  <IconoTipo tipo={f.tipo} />
                  <View style={{ flex: 1 }}>
                    <Text variant="titleSmall">{f.nombre}</Text>
                    <Text variant="bodyMedium">{`Usado ${formatDuration(f.horas * 60)}`}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text variant="titleSmall">{formatEnergy(f.kwh)}</Text>
                    <Text variant="bodySmall">{formatMoney(f.costo)}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <Nota>≈ calculado con la potencia del aparato y tu tarifa.</Nota>
          </>
        )}
        <Button mode="contained-tonal" onPress={onCerrar} contentStyle={{ minHeight: 48 }}>
          Cerrar
        </Button>
      </Modal>
    </Portal>
  );
}
