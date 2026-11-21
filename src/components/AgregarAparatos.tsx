import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { FlatList, View } from 'react-native';
import { Button, HelperText, List, Searchbar, Text } from 'react-native-paper';
import { GridComunes } from '@/components/GridComunes';
import { IconoTipo } from '@/components/IconoTipo';
import { Nota } from '@/components/Nota';
import { type Referencia, nombreReferencia } from '@/lib/aparatos';
import { TIPOS_COMUNES, buscarFichas, referenciaTipica, usoTipico } from '@/lib/bienvenida';
import { formatPower } from '@/lib/format';
import { supabase } from '@/lib/supabase';

type Ficha = Pick<Referencia, 'id' | 'tipo' | 'marca' | 'modelo' | 'potencia_w'>;
type Propio = { id: number; tipo: string };
const MAX_RESULTADOS = 6;

// Agregar aparatos: cuadrícula de comunes + búsqueda en el catálogo aprobado + enlace para registrar uno propio.
// `onCambio` se llama con la cantidad de aparatos activos cada vez que cambia la lista.
// En la configuración inicial /aparato aún está bloqueado: allí `permitirPropio` es false.
export function AgregarAparatos({ onCambio, permitirPropio = true }: { onCambio?: (n: number) => void; permitirPropio?: boolean }) {
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [propios, setPropios] = useState<Propio[]>([]);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [agregado, setAgregado] = useState<string | null>(null);

  const cargarPropios = useCallback(async () => {
    const { data } = await supabase.from('aparatos').select('id, tipo').is('archivado_en', null);
    const l = (data ?? []) as Propio[];
    setPropios(l);
    onCambio?.(l.length);
  }, [onCambio]);

  useEffect(() => {
    supabase
      .from('aparatos_referencia')
      .select('id, tipo, marca, modelo, potencia_w')
      .eq('estado', 'aprobada')
      .order('tipo')
      .order('marca')
      .then(({ data }) => setFichas(((data ?? []) as Ficha[]).map((f) => ({ ...f, potencia_w: Number(f.potencia_w) }))));
  }, []);

  // También al volver de registrar un aparato propio.
  useFocusEffect(
    useCallback(() => {
      cargarPropios();
    }, [cargarPropios]),
  );

  const agregados: Record<string, number> = {};
  for (const a of propios) if (TIPOS_COMUNES.some((t) => t.tipo === a.tipo)) agregados[a.tipo] ??= a.id;

  async function insertar(clave: string, f: Ficha, nombre: string, usoTipo: string) {
    const uso = usoTipico(usoTipo);
    setOcupado(clave);
    setError(null);
    setAgregado(null);
    const { error: e } = await supabase.from('aparatos').insert({
      nombre,
      tipo: f.tipo,
      potencia_w: f.potencia_w,
      cantidad: 1,
      uso_tipico_horas: uso.horas,
      uso_constante: uso.constante,
      referencia_id: f.id,
    });
    if (e) setError('No pudimos agregarlo. Intenta de nuevo.');
    else {
      // Cierra la búsqueda y confirma: sin esto parecía que el toque no hizo nada y se duplicaba.
      setQ('');
      setAgregado(`Agregamos ${nombre}.`);
      await cargarPropios();
    }
    setOcupado(null);
  }

  async function alternar(t: (typeof TIPOS_COMUNES)[number]) {
    const id = agregados[t.tipo];
    if (id) {
      setOcupado(t.tipo);
      setError(null);
      const { error: e } = await supabase.from('aparatos').update({ archivado_en: new Date().toISOString() }).eq('id', id);
      if (e) setError('No pudimos quitarlo. Intenta de nuevo.');
      else await cargarPropios();
      setOcupado(null);
      return;
    }
    const ref = referenciaTipica(fichas, t.tipo);
    if (!ref) return setError('No pudimos cargar la lista de aparatos. Revisa tu conexión.');
    await insertar(t.tipo, ref, t.nombre, t.tipo);
  }

  const resultados = buscarFichas(fichas, q);
  return (
    <View style={{ gap: 12 }}>
      <GridComunes fichas={fichas} agregados={agregados} ocupado={ocupado} onAlternar={alternar} />
      <Searchbar
        placeholder="Buscar por tipo, marca o modelo"
        value={q}
        onChangeText={(t) => {
          setQ(t);
          setAgregado(null);
        }}
        accessibilityLabel="Buscar aparato en el catálogo"
      />
      {agregado && (
        <Text variant="bodyMedium" accessibilityLiveRegion="polite">
          {`✓ ${agregado}`}
        </Text>
      )}
      {q.trim() !== '' && (
        <FlatList
          data={resultados.slice(0, MAX_RESULTADOS)}
          keyExtractor={(r) => String(r.id)}
          scrollEnabled={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text variant="bodyMedium">No encontramos ese aparato en el catálogo.</Text>}
          ListFooterComponent={
            resultados.length > MAX_RESULTADOS ? (
              <Text variant="bodySmall">{`Hay ${resultados.length - MAX_RESULTADOS} más: escribe más letras para acotar.`}</Text>
            ) : undefined
          }
          renderItem={({ item: r }) => (
            <List.Item
              title={nombreReferencia(r as Referencia)}
              description={`${r.tipo} · ${formatPower(r.potencia_w)}`}
              disabled={ocupado !== null}
              left={() => <View style={{ justifyContent: 'center' }}><IconoTipo tipo={r.tipo} /></View>}
              right={(p) => <List.Icon {...p} icon="plus-circle-outline" />}
              onPress={() => insertar(`ficha${r.id}`, r, nombreReferencia(r as Referencia), r.tipo)}
              accessibilityLabel={`Agregar ${nombreReferencia(r as Referencia)}, ${formatPower(r.potencia_w)}`}
            />
          )}
        />
      )}
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
      <Nota>Al agregar usamos la potencia del catálogo, 1 unidad y un uso típico del tipo (por ejemplo, la nevera cuenta 8 h al día porque su motor se prende y apaga). Puedes ajustarlo en Aparatos.</Nota>
      {permitirPropio ? (
        <Button icon="pencil-plus" contentStyle={{ minHeight: 48 }} onPress={() => router.push('/aparato')}>
          Registrar uno que no está
        </Button>
      ) : (
        <Text variant="bodyMedium">¿No está el tuyo? Después podrás registrarlo en la pestaña Aparatos.</Text>
      )}
    </View>
  );
}
