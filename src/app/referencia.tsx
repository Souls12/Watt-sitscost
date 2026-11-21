import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Button, Chip, Dialog, HelperText, List, Portal, Text, TextInput } from 'react-native-paper';
import { IconoTipo } from '@/components/IconoTipo';
import { Formulario } from '@/components/Formulario';
import { type Referencia, criterioTexto, nombreReferencia } from '@/lib/aparatos';
import { formatPower } from '@/lib/format';
import { leerNumero } from '@/lib/numero';
import { supabase } from '@/lib/supabase';
import { useEsAdministrador } from '@/lib/avisos';

// Ficha de un aparato de referencia: potencia, criterio y fuente.
export default function Ficha() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [r, setR] = useState<Referencia | null>(null);
  const administrador = useEsAdministrador();
  const [corrigiendo, setCorrigiendo] = useState(false);
  const [potencia, setPotencia] = useState('');
  const [criterio, setCriterio] = useState<Referencia['criterio_potencia']>('nominal');
  const [fuente, setFuente] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargar = () =>
    supabase
      .from('aparatos_referencia')
      .select('*')
      .eq('id', Number(id))
      .single()
      .then(({ data }) => setR(data as Referencia | null));
  useEffect(() => {
    cargar();
  }, [id]);

  function abrirCorreccion() {
    if (!r) return;
    setPotencia(String(r.potencia_w).replace('.', ','));
    setCriterio(r.criterio_potencia);
    setFuente(r.fuente);
    setMensaje('');
    setCorrigiendo(true);
  }

  // Corregir la ficha avisa a quienes la copiaron; cada quien decide si actualiza su aparato.
  async function corregir() {
    const w = leerNumero(potencia);
    if (!(w > 0)) return setMensaje('La potencia debe ser mayor que cero.');
    const { data, error } = await supabase.rpc('corregir_referencia', {
      p_id: Number(id),
      p_potencia_w: w,
      p_criterio: criterio,
      p_fuente: fuente,
    });
    if (error) return setMensaje(error.message);
    setCorrigiendo(false);
    setMensaje(data ? `Avisamos a ${data} ${data === 1 ? 'copia' : 'copias'} de esta ficha.` : 'Ficha corregida.');
    cargar();
  }

  return (
    <Formulario titulo={r ? nombreReferencia(r) : 'Ficha'}>
      {r && (
        <>
          <List.Item title={formatPower(r.potencia_w)} description={criterioTexto[r.criterio_potencia]} left={(p) => <List.Icon {...p} icon="flash" />} />
          <List.Item title={r.tipo} description="Tipo" left={() => <View style={{ justifyContent: 'center', marginLeft: 16 }}><IconoTipo tipo={r.tipo} /></View>} />
          {r.capacidad && <List.Item title={r.capacidad} description="Capacidad o tamaño" left={(p) => <List.Icon {...p} icon="ruler" />} />}
          {r.consumo_kwh_mes_etiqueta && (
            <List.Item
              title={`${String(r.consumo_kwh_mes_etiqueta).replace('.', ',')} kWh/mes`}
              description="Consumo de la etiqueta RETIQ"
              left={(p) => <List.Icon {...p} icon="tag" />}
            />
          )}
          <List.Item title={r.fuente} titleNumberOfLines={3} description="Fuente de la potencia" left={(p) => <List.Icon {...p} icon="link" />} />
          <Button mode="contained" onPress={() => router.push({ pathname: '/aparato', params: { referencia: String(r.id) } })}>
            Agregar a mis aparatos
          </Button>
        </>
      )}
      {administrador && r && (
        <Button icon="pencil" onPress={abrirCorreccion}>
          Corregir ficha
        </Button>
      )}
      {!corrigiendo && !!mensaje && <Text>{mensaje}</Text>}
      <Button onPress={() => router.back()}>Volver</Button>
      <Portal>
        <Dialog visible={corrigiendo} onDismiss={() => setCorrigiendo(false)}>
          <Dialog.Title>Corregir ficha</Dialog.Title>
          <Dialog.Content style={{ gap: 8 }}>
            <TextInput label="Potencia (W)" mode="outlined" keyboardType="decimal-pad" value={potencia} onChangeText={setPotencia} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(Object.keys(criterioTexto) as Referencia['criterio_potencia'][]).map((c) => (
                <Chip key={c} selected={criterio === c} onPress={() => setCriterio(c)}>
                  {criterioTexto[c]}
                </Chip>
              ))}
            </View>
            <TextInput label="Fuente" mode="outlined" value={fuente} onChangeText={setFuente} />
            <HelperText type="error" visible={!!mensaje}>
              {mensaje}
            </HelperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCorrigiendo(false)}>Cancelar</Button>
            <Button onPress={corregir}>Guardar y avisar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Formulario>
  );
}
