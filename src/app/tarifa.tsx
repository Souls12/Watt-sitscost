import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Button, List, Text } from 'react-native-paper';
import { Formulario } from '@/components/Formulario';
import { useTarifa } from '@/components/CampoTarifa';
import { formatTarifa } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { leerTarifa } from '@/lib/tarifa';

type Fila = { id: number; valor_kwh: number; desde: string; tarifa_compartida_version_id: number | null };
type Compartida = { id: number; tarifa_id: number; ciudad_id: number; estrato: number; empresa_id: number; valor_kwh: number; estado: string; desde: string | null };

export default function Tarifa() {
  const { session } = useSesion();
  const { texto, campo, validar } = useTarifa();
  const [historial, setHistorial] = useState<Fila[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [compartidas, setCompartidas] = useState<Compartida[]>([]);
  const [misVersiones, setMisVersiones] = useState<number[]>([]);
  const [zona, setZona] = useState<{ ciudad_id: number; estrato: number; empresa_id: number } | null>(null);

  const cargar = useCallback(() => {
    supabase
      .from('tarifas_usuario')
      .select('id, valor_kwh, desde, tarifa_compartida_version_id')
      .order('desde', { ascending: false })
      .order('id', { ascending: false })
      .then(({ data }) => setHistorial(data ?? []));
    // RLS deja ver todo al administrador: por eso se filtra aquí a mi zona y a mis versiones. autor_id no se expone: mis versiones salen de mis propuestas.
    supabase.from('perfiles').select('ciudad_id, estrato, empresa_id').eq('id', session?.user.id ?? '').maybeSingle().then(({ data }) => setZona(data));
    supabase.from('propuestas').select('tarifa_version_id').eq('tipo', 'tarifa').eq('propuesto_por', session?.user.id ?? '')
      .then(({ data }) => setMisVersiones((data ?? []).map((x) => Number(x.tarifa_version_id))));
    supabase
      .from('tarifas_compartidas')
      .select('id, tarifa_id, ciudad_id, estrato, empresa_id, valor_kwh, estado, desde')
      .order('id', { ascending: false })
      .then(({ data }) => setCompartidas(data ?? []));
  }, [session]);
  useFocusEffect(cargar);

  const guardar = async () => {
    setEnviando(true);
    const { error } = await supabase.from('tarifas_usuario').insert({ valor_kwh: leerTarifa(texto) });
    setEnviando(false);
    setError(error ? 'No pudimos guardar la tarifa. Intenta de nuevo.' : null);
    if (!error) cargar();
  };

  const rpc = async (nombre: 'compartir_tarifa' | 'elegir_tarifa', args: { p_valor: number } | { p_version: number }) => {
    const { error } = await supabase.rpc(nombre, args as never);
    setError(error ? error.message : null);
    cargar();
  };

  // La última versión aprobada de cada tarifa compartida (la lista viene de la más nueva a la más vieja).
  const aprobadas = compartidas
    .filter((c) => c.estado === 'aprobada' && zona && c.ciudad_id === zona.ciudad_id && c.estrato === zona.estrato && c.empresa_id === zona.empresa_id).filter((c, i, l) => l.findIndex((o) => o.tarifa_id === c.tarifa_id) === i);
  const pendiente = compartidas.find((c) => c.estado === 'pendiente' && misVersiones.includes(c.id));
  const enlazada = historial[0]?.tarifa_compartida_version_id;

  return (
    <Formulario titulo="Mi tarifa" atras="/cuenta">
      <Text variant="bodyLarge">
        {historial[0]
          ? `Vigente: ${formatTarifa(historial[0].valor_kwh)} por kWh desde el ${historial[0].desde}.`
          : 'Aún no tienes tarifa.'}
      </Text>
      {campo}
      {error && <Text variant="bodySmall">{error}</Text>}
      <Button mode="contained" onPress={() => validar(guardar)} loading={enviando} disabled={enviando}>
        Actualizar tarifa
      </Button>
      {enlazada && <Text variant="bodySmall">Tu tarifa está enlazada a una tarifa compartida. Si cambia, te avisamos y tú decides.</Text>}
      <List.Subheader>Compartir</List.Subheader>
      {pendiente ? (
        <Text variant="bodyMedium">{`Tu versión de ${formatTarifa(pendiente.valor_kwh)} por kWh espera la aprobación del administrador.`}</Text>
      ) : (
        <Button disabled={!historial[0]} onPress={() => rpc('compartir_tarifa', { p_valor: historial[0].valor_kwh })}>
          Compartir mi tarifa vigente
        </Button>
      )}
      <List.Subheader>Tarifas compartidas de mi zona</List.Subheader>
      {aprobadas.length === 0 && <Text variant="bodyMedium">Aún no hay tarifas aprobadas para tu ciudad, estrato y empresa.</Text>}
      {aprobadas.map((c) => (
        <List.Item
          key={c.id}
          title={`${formatTarifa(c.valor_kwh)} por kWh`}
          description={`Aprobada el ${c.desde}`}
          right={() => (
            <Button disabled={enlazada === c.id} onPress={() => rpc('elegir_tarifa', { p_version: c.id })}>
              {enlazada === c.id ? 'Elegida' : 'Usar'}
            </Button>
          )}
        />
      ))}
      <List.Subheader>Historial</List.Subheader>
      {historial.map((f) => (
        <List.Item key={f.id} title={`${formatTarifa(f.valor_kwh)} por kWh`} description={`Desde el ${f.desde}`} />
      ))}
      <Button onPress={() => router.back()}>Volver</Button>
    </Formulario>
  );
}
