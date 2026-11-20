import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { FlatList, ScrollView } from 'react-native';
import { Button, Card, Dialog, HelperText, List, Portal, Text, TextInput } from 'react-native-paper';
import { Pantalla } from '@/components/Pantalla';
import { formatPower } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useEsAdministrador } from '@/lib/avisos';

type Propuesta = {
  id: number;
  tipo: 'aparato' | 'ciudad' | 'empresa' | 'tarifa';
  estado: 'pendiente' | 'pospuesta';
  creado_en: string;
  referencia: { tipo: string; marca: string | null; modelo: string | null; potencia_w: number } | null;
  ciudad: { nombre: string; departamento: string | null } | null;
  empresa: { nombre: string } | null;
  tarifa: { valor_kwh: number; estrato: number; ciudad: { nombre: string } | null; empresa: { nombre: string } | null } | null;
};
type Decision = 'aprobada' | 'rechazada' | 'pospuesta' | 'unida';
type Lugar = { id: number; nombre: string; departamento?: string | null };

const verbo: Record<Decision, string> = { aprobada: 'Aprobar', rechazada: 'Rechazar', pospuesta: 'Posponer', unida: 'Unir' };
const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function describir(p: Propuesta) {
  if (p.referencia)
    return { titulo: `Aparato: ${p.referencia.marca} ${p.referencia.modelo}`, detalle: `${p.referencia.tipo} · ${formatPower(p.referencia.potencia_w)}` };
  if (p.ciudad) return { titulo: `Ciudad: ${p.ciudad.nombre}`, detalle: p.ciudad.departamento ?? 'Sin departamento' };
  if (p.tarifa)
    return {
      titulo: `Tarifa: $${p.tarifa.valor_kwh} por kWh`,
      detalle: `${p.tarifa.ciudad?.nombre ?? ''} · estrato ${p.tarifa.estrato} · ${p.tarifa.empresa?.nombre ?? ''}`,
    };
  return { titulo: `Empresa: ${p.empresa?.nombre ?? ''}`, detalle: 'Empresa proveedora' };
}

// Revisión del administrador. La base de datos verifica el rol: otro usuario no ve propuestas ajenas ni puede resolverlas.
export default function Revision() {
  const [propuestas, setPropuestas] = useState<Propuesta[] | null>(null);
  const [lugares, setLugares] = useState<{ ciudad: Lugar[]; empresa: Lugar[] }>({ ciudad: [], empresa: [] });
  const [abierta, setAbierta] = useState<{ p: Propuesta; decision: Decision } | null>(null);
  const [nota, setNota] = useState('');
  const [filtro, setFiltro] = useState('');
  const [unirCon, setUnirCon] = useState<Lugar | null>(null);
  const [error, setError] = useState('');
  const administrador = useEsAdministrador();

  async function cargar() {
    const { data } = await supabase
      .from('propuestas')
      .select('id, tipo, estado, creado_en, referencia:aparatos_referencia(tipo, marca, modelo, potencia_w), ciudad:ciudades(nombre, departamento), empresa:empresas(nombre), tarifa:tarifas_compartidas(valor_kwh, estrato, ciudad:ciudades(nombre), empresa:empresas(nombre))')
      .in('estado', ['pendiente', 'pospuesta'])
      .order('estado') // 'pendiente' antes que 'pospuesta'
      .order('creado_en');
    setPropuestas((data ?? []) as unknown as Propuesta[]);
  }

  useEffect(() => {
    cargar();
    Promise.all([
      supabase.from('ciudades').select('id, nombre, departamento').eq('estado', 'aprobada').order('nombre'),
      supabase.from('empresas').select('id, nombre').eq('estado', 'aprobada').order('nombre'),
    ]).then(([c, e]) => setLugares({ ciudad: c.data ?? [], empresa: e.data ?? [] }));
  }, []);

  function abrir(p: Propuesta, decision: Decision) {
    setAbierta({ p, decision });
    setNota('');
    setFiltro('');
    setUnirCon(null);
    setError('');
  }

  async function confirmar() {
    if (!abierta) return;
    if (abierta.decision === 'unida' && !unirCon) return setError('Elige con cuál unirla.');
    const { error: e } = await supabase.rpc('resolver_propuesta', {
      p_id: abierta.p.id,
      p_decision: abierta.decision,
      p_nota: nota.trim() || undefined,
      p_unir_con: unirCon?.id,
    });
    if (e) return setError(e.message);
    setAbierta(null);
    cargar();
  }

  const opciones =
    abierta && (abierta.p.tipo === 'ciudad' || abierta.p.tipo === 'empresa')
      ? lugares[abierta.p.tipo].filter((l) => sinTildes(l.nombre).includes(sinTildes(filtro))).slice(0, 5)
      : [];

  return (
    <Pantalla titulo="Revisar propuestas">
      <FlatList
        data={administrador ? (propuestas ?? []) : []}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={!administrador ? <Text>Solo el administrador puede revisar propuestas.</Text> : undefined}
        ListEmptyComponent={administrador && propuestas?.length === 0 ? <Text>No hay propuestas por revisar.</Text> : undefined}
        ListFooterComponent={<Button onPress={() => router.back()}>Volver</Button>}
        renderItem={({ item: p }) => {
        const d = describir(p);
        return (
          <Card mode="outlined">
            <Card.Title
              title={d.titulo}
              titleNumberOfLines={2}
              subtitle={`${d.detalle}${p.estado === 'pospuesta' ? ' · pospuesta' : ''}`}
            />
            <Card.Actions style={{ flexWrap: 'wrap' }}>
              {p.estado === 'pendiente' && <Button onPress={() => abrir(p, 'pospuesta')}>Posponer</Button>}
              {(p.tipo === 'ciudad' || p.tipo === 'empresa') && <Button onPress={() => abrir(p, 'unida')}>Unir</Button>}
              <Button onPress={() => abrir(p, 'rechazada')}>Rechazar</Button>
              <Button mode="contained" onPress={() => abrir(p, 'aprobada')}>
                Aprobar
              </Button>
            </Card.Actions>
          </Card>
        );
        }}
      />
      <Portal>
        <Dialog visible={!!abierta} onDismiss={() => setAbierta(null)}>
          <Dialog.Title>{abierta ? `${verbo[abierta.decision]}: ${describir(abierta.p).titulo}` : ''}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={{ gap: 8, paddingVertical: 8 }} keyboardShouldPersistTaps="handled">
              {abierta?.decision === 'unida' && (
                <>
                  <Text>Es un duplicado: pasamos a quien la propuso a la existente y borramos la propuesta.</Text>
                  {unirCon ? (
                    <List.Item title={unirCon.nombre} left={(p) => <List.Icon {...p} icon="check" />} onPress={() => setUnirCon(null)} />
                  ) : (
                    <>
                      <TextInput label="Buscar la existente" mode="outlined" value={filtro} onChangeText={setFiltro} />
                      {opciones.map((l) => (
                        <List.Item key={l.id} title={l.nombre} description={l.departamento ?? undefined} onPress={() => setUnirCon(l)} />
                      ))}
                    </>
                  )}
                </>
              )}
              {abierta?.decision !== 'pospuesta' && (
                <TextInput label="Nota para el usuario (opcional)" mode="outlined" multiline value={nota} onChangeText={setNota} maxLength={500} />
              )}
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setAbierta(null)}>Cancelar</Button>
            <Button onPress={confirmar}>{abierta ? verbo[abierta.decision] : ''}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Pantalla>
  );
}
