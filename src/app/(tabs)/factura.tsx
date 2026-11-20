import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Button, Dialog, List, Portal, Text, TextInput } from 'react-native-paper';
import { CampoFecha } from '@/components/CampoFecha';
import { Formulario } from '@/components/Formulario';
import { GuiaFactura } from '@/components/GuiaFactura';
import { useSesion } from '@/lib/sesion';
import { supabase } from '@/lib/supabase';
import { formatEnergy, formatMoney } from '@/lib/format';
import { hoyIso } from '@/lib/fechas';
import { leerNumero } from '@/lib/numero';
import { META_AVISO, PORCENTAJES, calcularMeta, validarFactura } from '@/lib/factura';

type Factura = { id: number; kwh_facturado: number; inicio: string; fin: string };
type Periodo = { inicio: string; fin_estimado: string; porcentaje: number; meta_kwh: number; estado: string };


export default function FacturaTab() {
  const { session } = useSesion();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [periodo, setPeriodo] = useState<Periodo | null>(null);
  const [tarifa, setTarifa] = useState(0);
  const [editando, setEditando] = useState<number | null>(null);
  const [kwh, setKwh] = useState('');
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [pct, setPct] = useState('10');
  const [error, setError] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [preguntaTarifa, setPreguntaTarifa] = useState(false);
  const [porEliminar, setPorEliminar] = useState<number | null>(null);

  const cargar = useCallback(() => {
    const falla = () => setError('No pudimos actualizar tus datos. Revisa tu conexión.');
    supabase.from('facturas').select('id, kwh_facturado, inicio, fin').order('fin', { ascending: false })
      .then(({ data, error: e }) => (e ? falla() : setFacturas((data ?? []) as Factura[])));
    supabase.from('periodo_actual').select('inicio, fin_estimado, porcentaje, meta_kwh, estado').maybeSingle()
      .then(({ data, error: e }) => (e ? falla() : setPeriodo(data as Periodo | null)));
    if (session) supabase.rpc('tarifa_vigente', { p_usuario: session.user.id })
      .then(({ data, error: e }) => (e ? falla() : setTarifa(Number(data ?? 0))));
  }, [session]);
  useFocusEffect(cargar);

  const ultima = facturas[0];
  const porcentaje = leerNumero(pct);
  const pctValido = porcentaje > 0 && porcentaje < 100;
  const meta = ultima && pctValido ? calcularMeta(ultima.kwh_facturado, porcentaje, tarifa) : null;

  const guardarFactura = async () => {
    const r = validarFactura(kwh, inicio, fin, hoyIso());
    if (!r.ok) return setError(r.error);
    const { error: e } = editando
      ? await supabase.from('facturas').update(r.valor).eq('id', editando)
      : await supabase.from('facturas').insert(r.valor);
    if (e) {
      setError(e.code === '23P01' ? 'Esas fechas se cruzan con otra factura.' : e.message);
      return;
    }
    setError(null); setKwh(''); setInicio(''); setFin('');
    if (!editando) setPreguntaTarifa(true);
    setEditando(null);
    cargar();
  };

  const corregir = (f: Factura) => {
    setEditando(f.id); setKwh(String(f.kwh_facturado)); setInicio(f.inicio); setFin(f.fin);
  };
  const eliminar = async (id: number) => {
    setPorEliminar(null);
    const { error: e } = await supabase.from('facturas').delete().eq('id', id);
    setError(e ? (e.code === '23514' ? e.message : 'No pudimos eliminar la factura.') : null);
    cargar();
  };

  const crearPeriodo = async () => {
    setConfirmar(false);
    if (!ultima) return;
    const { error: e } = await supabase.from('periodos').insert({ factura_base_id: ultima.id, porcentaje });
    setError(e ? (e.code === '23505' ? 'Ya tienes un periodo abierto.' : 'No pudimos crear el periodo.') : null);
    cargar();
  };
  const cambiarMeta = async () => {
    setConfirmar(false);
    const { error: e } = await supabase.rpc('cambiar_meta', { p_porcentaje: porcentaje });
    setError(e ? 'No pudimos cambiar la meta.' : null);
    cargar();
  };
  const definirMeta = () => {
    if (!pctValido) return setError('Escribe un porcentaje entre 1 y 99.');
    if (porcentaje > META_AVISO) return setConfirmar(true);
    periodo ? cambiarMeta() : crearPeriodo();
  };

  return (
    <Formulario titulo="Factura">
      <GuiaFactura />
      <TextInput label="Consumo facturado (kWh)" value={kwh} onChangeText={setKwh} keyboardType="decimal-pad" />
      <CampoFecha label="Inicio del consumo" value={inicio} onChange={setInicio} maxima={hoyIso()} />
      <CampoFecha label="Fin del consumo" value={fin} onChange={setFin} maxima={hoyIso()} />
      {error && <Text variant="bodySmall">{error}</Text>}
      <Button mode="contained" onPress={guardarFactura}>{editando ? 'Guardar corrección' : 'Registrar factura'}</Button>
      {editando && <Button onPress={() => { setEditando(null); setKwh(''); setInicio(''); setFin(''); }}>Cancelar</Button>}

      <List.Subheader>Mis facturas</List.Subheader>
      {facturas.map((f) => (
        <List.Item
          key={f.id}
          title={formatEnergy(f.kwh_facturado)}
          description={`${f.inicio} a ${f.fin}`}
          right={() => (
            <>
              <Button onPress={() => corregir(f)}>Corregir</Button>
              <Button onPress={() => setPorEliminar(f.id)}>Eliminar</Button>
            </>
          )}
        />
      ))}

      <List.Subheader>Mi meta</List.Subheader>
      {periodo && (
        <Text variant="bodyLarge">
          {`Periodo del ${periodo.inicio} al ${periodo.fin_estimado}${periodo.estado === 'extendido' ? ' (extendido)' : ''}: meta de ${formatEnergy(periodo.meta_kwh)}, ${periodo.porcentaje} % menos.`}
        </Text>
      )}
      {ultima ? (
        <>
          {PORCENTAJES.map((p) => (
            <Button key={p} mode={porcentaje === p ? 'contained-tonal' : 'outlined'} onPress={() => setPct(String(p))}>{`${p} %`}</Button>
          ))}
          <TextInput label="Otro porcentaje de reducción" value={pct} onChangeText={setPct} keyboardType="decimal-pad" />
          {meta && (
            <Text variant="titleMedium">{`Meta: ${formatEnergy(meta.kwh)} · ${formatMoney(meta.pesos)}`}</Text>
          )}
          <Button mode="contained" onPress={definirMeta}>{periodo ? 'Cambiar mi meta' : 'Empezar mi periodo'}</Button>
        </>
      ) : (
        <Text variant="bodyMedium">Registra tu factura para definir una meta.</Text>
      )}

      <Portal>
        <Dialog visible={preguntaTarifa} onDismiss={() => setPreguntaTarifa(false)}>
          <Dialog.Title>¿El valor por kWh sigue igual?</Dialog.Title>
          <Dialog.Content>
            <Text>{`Tu tarifa vigente es ${formatMoney(tarifa)} por kWh. Compárala con tu factura nueva.`}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPreguntaTarifa(false)}>Sigue igual</Button>
            <Button onPress={() => { setPreguntaTarifa(false); router.push('/tarifa'); }}>Cambió</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={porEliminar !== null} onDismiss={() => setPorEliminar(null)}>
          <Dialog.Title>¿Eliminar esta factura?</Dialog.Title>
          <Dialog.Content>
            <Text>Si cerró un periodo, ese periodo se reabre. Esta acción no se puede deshacer.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPorEliminar(null)}>Cancelar</Button>
            <Button onPress={() => eliminar(porEliminar!)}>Eliminar</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={confirmar} onDismiss={() => setConfirmar(false)}>
          <Dialog.Title>Una meta ambiciosa</Dialog.Title>
          <Dialog.Content>
            <Text>{`Reducir más de ${META_AVISO} % es difícil de sostener. ¿Quieres usar ${porcentaje} % de todos modos?`}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmar(false)}>Cambiar</Button>
            <Button onPress={periodo ? cambiarMeta : crearPeriodo}>Sí, usar {porcentaje} %</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Formulario>
  );
}
