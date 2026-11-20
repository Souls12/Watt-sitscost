import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Button, List, Text } from 'react-native-paper';
import { Formulario } from '@/components/Formulario';
import { useTarifa } from '@/components/CampoTarifa';
import { supabase } from '@/lib/supabase';
import { leerTarifa } from '@/lib/tarifa';

type Fila = { id: number; valor_kwh: number; desde: string };

export default function Tarifa() {
  const { texto, campo, validar } = useTarifa();
  const [historial, setHistorial] = useState<Fila[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(() => {
    supabase
      .from('tarifas_usuario')
      .select('id, valor_kwh, desde')
      .order('desde', { ascending: false })
      .order('id', { ascending: false })
      .then(({ data }) => setHistorial(data ?? []));
  }, []);
  useFocusEffect(cargar);

  const guardar = async () => {
    setEnviando(true);
    const { error } = await supabase.from('tarifas_usuario').insert({ valor_kwh: leerTarifa(texto) });
    setEnviando(false);
    setError(error ? 'No pudimos guardar la tarifa. Intenta de nuevo.' : null);
    if (!error) cargar();
  };

  return (
    <Formulario titulo="Mi tarifa">
      <Text variant="bodyLarge">
        {historial[0]
          ? `Vigente: $${historial[0].valor_kwh} por kWh desde el ${historial[0].desde}.`
          : 'Aún no tienes tarifa.'}
      </Text>
      {campo}
      {error && <Text variant="bodySmall">{error}</Text>}
      <Button mode="contained" onPress={() => validar(guardar)} loading={enviando} disabled={enviando}>
        Actualizar tarifa
      </Button>
      <List.Subheader>Historial</List.Subheader>
      {historial.map((f) => (
        <List.Item key={f.id} title={`$${f.valor_kwh} por kWh`} description={`Desde el ${f.desde}`} />
      ))}
      <Button onPress={() => router.back()}>Volver</Button>
    </Formulario>
  );
}
