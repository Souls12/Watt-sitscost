import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Button, Chip, Dialog, HelperText, Portal, Switch, Text, TextInput, useTheme } from 'react-native-paper';
import { Nota } from '@/components/Nota';
import { Formulario } from '@/components/Formulario';
import { GuiaEtiqueta } from '@/components/GuiaEtiqueta';
import { type Aparato, type Referencia, nombreReferencia, useColoresTipo } from '@/lib/aparatos';
import { supabase } from '@/lib/supabase';
import { validarAparato } from '@/lib/validacion';

// Tres modos según los parámetros: ?referencia=<id> (copia de una ficha), ?id=<id> (editar) o ninguno (aparato propio).
export default function AparatoPantalla() {
  const { referencia, id } = useLocalSearchParams<{ referencia?: string; id?: string }>();
  const theme = useTheme();
  const colores = useColoresTipo();
  const [tipo, setTipo] = useState('Otro');
  const [refId, setRefId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [potencia, setPotencia] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [usoHoras, setUsoHoras] = useState('');
  const [usoConstante, setUsoConstante] = useState(false);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  // Estado de la ficha de origen: 'aprobada' (copia del catálogo), 'propuesta' o 'rechazada' (propuesta propia).
  const [refEstado, setRefEstado] = useState<string | null>(null);
  const [proponer, setProponer] = useState(false);
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [errorPropuesta, setErrorPropuesta] = useState('');

  useEffect(() => {
    if (referencia)
      supabase
        .from('aparatos_referencia')
        .select('*')
        .eq('id', Number(referencia))
        .single()
        .then(({ data }) => {
          const r = data as Referencia | null;
          if (!r) return;
          setRefId(r.id);
          setRefEstado('aprobada');
          setTipo(r.tipo);
          setNombre(nombreReferencia(r));
          setPotencia(String(r.potencia_w).replace('.', ','));
        });
    if (id)
      supabase
        .from('aparatos')
        .select('*, ref:aparatos_referencia(estado)')
        .eq('id', Number(id))
        .single()
        .then(({ data }) => {
          const a = data as (Aparato & { ref: { estado: string } | null }) | null;
          if (!a) return;
          setRefId(a.referencia_id);
          setRefEstado(a.ref?.estado ?? null);
          setTipo(a.tipo);
          setNombre(a.nombre);
          setPotencia(String(a.potencia_w).replace('.', ','));
          setCantidad(String(a.cantidad));
          setUsoHoras(a.uso_tipico_horas ? String(a.uso_tipico_horas).replace('.', ',') : '');
          setUsoConstante(a.uso_constante);
        });
  }, [referencia, id]);

  async function guardar() {
    const r = validarAparato({ nombre, potencia, cantidad, usoHoras, usoConstante });
    if (!r.ok) return setError(r.error);
    setError('');
    setGuardando(true);
    const { error: e } = id
      ? await supabase.from('aparatos').update({ ...r.valor, tipo }).eq('id', Number(id))
      : await supabase.from('aparatos').insert({ ...r.valor, tipo, referencia_id: refId });
    setGuardando(false);
    if (e) return setError('No pudimos guardar. Revisa los datos e inténtalo de nuevo.');
    router.dismissTo('/aparatos');
  }

  async function archivar() {
    setConfirmar(false);
    const { error: e } = await supabase
      .from('aparatos')
      .update({ archivado_en: new Date().toISOString() })
      .eq('id', Number(id));
    if (e) return setError('No pudimos archivarlo. Inténtalo de nuevo.');
    router.dismissTo('/aparatos');
  }

  async function enviarPropuesta() {
    const { error: e } = await supabase.rpc('proponer_aparato', { p_aparato: Number(id), p_marca: marca, p_modelo: modelo });
    if (e) return setErrorPropuesta(e.message);
    setProponer(false);
    setRefEstado('propuesta');
  }

  const propio = !referencia && !id;
  return (
    <Formulario atras="/aparatos" titulo={id ? 'Editar aparato' : referencia ? 'Agregar mi copia' : 'Aparato propio'}>
      {propio && <GuiaEtiqueta />}
      {refEstado === 'propuesta' && (
        <Text variant="bodySmall">Lo propusiste al catálogo y está en revisión. Mientras tanto lo usas igual.</Text>
      )}
      {refEstado === 'aprobada' && (
        <Nota>Usamos la potencia típica de este tipo de aparato; puedes ajustarla.</Nota>
      )}
      <TextInput label="Nombre" mode="outlined" value={nombre} onChangeText={setNombre} />
      {propio && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(colores).map(([t, c]) => (
            <Chip key={t} selected={tipo === t} onPress={() => setTipo(t)} style={{ borderLeftWidth: 6, borderLeftColor: c }}>
              {t}
            </Chip>
          ))}
        </View>
      )}
      <TextInput
        label="Potencia (W)"
        mode="outlined"
        keyboardType="decimal-pad"
        value={potencia}
        onChangeText={setPotencia}
        right={<TextInput.Affix text="W" />}
      />
      <TextInput label="Cantidad de unidades iguales" mode="outlined" keyboardType="number-pad" value={cantidad} onChangeText={setCantidad} />
      <TextInput
        label="Uso típico (horas al día)"
        mode="outlined"
        keyboardType="decimal-pad"
        value={usoHoras}
        onChangeText={setUsoHoras}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 48 }}>
        <Text variant="bodyLarge" style={{ flex: 1 }}>
          Uso constante (nevera, router)
        </Text>
        <Switch value={usoConstante} onValueChange={setUsoConstante} />
      </View>
      {usoConstante && <Nota>Lo registramos solo cada noche con las horas al día que indiques.</Nota>}
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
      <Button mode="contained" loading={guardando} disabled={guardando} onPress={guardar}>
        Guardar
      </Button>
      {id && (
        <Button textColor={theme.colors.error} onPress={() => setConfirmar(true)}>
          Eliminar
        </Button>
      )}
      {id && (refEstado === null || refEstado === 'rechazada') && (
        <Button icon="book-plus-outline" onPress={() => { setErrorPropuesta(''); setProponer(true); }}>
          Proponer al catálogo
        </Button>
      )}
      <Button onPress={() => router.back()}>Volver</Button>
      <Portal>
        <Dialog visible={proponer} onDismiss={() => setProponer(false)}>
          <Dialog.Title>Proponer al catálogo</Dialog.Title>
          <Dialog.Content style={{ gap: 8 }}>
            <Text>Enviamos su tipo y potencia para que otros lo encuentren. Tu aparato no cambia, ni siquiera si no se aprueba.</Text>
            <TextInput label="Marca" mode="outlined" value={marca} onChangeText={setMarca} />
            <TextInput label="Modelo" mode="outlined" value={modelo} onChangeText={setModelo} />
            <HelperText type="error" visible={!!errorPropuesta}>
              {errorPropuesta}
            </HelperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setProponer(false)}>Cancelar</Button>
            <Button onPress={enviarPropuesta}>Proponer</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={confirmar} onDismiss={() => setConfirmar(false)}>
          <Dialog.Title>¿Eliminar este aparato?</Dialog.Title>
          <Dialog.Content>
            <Text>Se archiva: deja de aceptar usos nuevos, pero conservamos lo que ya registraste.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmar(false)}>Cancelar</Button>
            <Button onPress={archivar}>Eliminar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Formulario>
  );
}
