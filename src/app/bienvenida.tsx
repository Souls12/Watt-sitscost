import { useState } from 'react';
import { router } from 'expo-router';
import { Button, Text, TextInput } from 'react-native-paper';
import { CampoFecha } from '@/components/CampoFecha';
import { Formulario } from '@/components/Formulario';
import { GuiaFactura } from '@/components/GuiaFactura';
import { useBienvenida } from '@/lib/ajustes';
import { hoyIso } from '@/lib/fechas';
import { useSesion } from '@/lib/sesion';
import { supabase } from '@/lib/supabase';
import { formatEnergy, formatMoney } from '@/lib/format';
import { PORCENTAJES, calcularMeta, validarFactura } from '@/lib/factura';

// Bienvenida tras el registro: factura y meta son opcionales; al final invita al catálogo.
export default function Bienvenida() {
  const { session } = useSesion();
  const { terminarBienvenida } = useBienvenida();
  const [paso, setPaso] = useState<'factura' | 'meta' | 'aparatos'>('factura');
  const [kwh, setKwh] = useState('');
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [pct, setPct] = useState(10);
  const [factura, setFactura] = useState<{ id: number; kwh: number } | null>(null);
  const [tarifa, setTarifa] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function guardarFactura() {
    const r = validarFactura(kwh, inicio, fin, hoyIso());
    if (!r.ok) return setError(r.error);
    const { data, error: e } = await supabase.from('facturas').insert(r.valor).select('id').single();
    if (e || !data) return setError(e?.code === '23P01' ? 'Esas fechas se cruzan con otra factura.' : 'No pudimos guardar la factura.');
    const { data: t } = await supabase.rpc('tarifa_vigente', { p_usuario: session!.user.id });
    setTarifa(Number(t ?? 0));
    setFactura({ id: data.id, kwh: r.valor.kwh_facturado });
    setError(null);
    setPaso('meta');
  }

  async function guardarMeta() {
    const { error: e } = await supabase.from('periodos').insert({ factura_base_id: factura!.id, porcentaje: pct });
    if (e) return setError('No pudimos crear el periodo.');
    setError(null);
    setPaso('aparatos');
  }

  // Terminar saca la bienvenida del guard; el catálogo se abre ya sobre las pestañas.
  function terminar(alCatalogo: boolean) {
    terminarBienvenida();
    if (alCatalogo) setTimeout(() => router.push('/catalogo'), 0);
  }

  const meta = factura ? calcularMeta(factura.kwh, pct, tarifa) : null;

  return (
    <Formulario titulo="Bienvenida">
      {paso === 'factura' ? (
        <>
          <Text variant="titleMedium">Tu última factura (opcional)</Text>
          <Text variant="bodyMedium">Con ella podemos proponerte una meta de ahorro.</Text>
          <GuiaFactura />
          <TextInput label="Consumo facturado (kWh)" value={kwh} onChangeText={setKwh} keyboardType="decimal-pad" />
          <CampoFecha label="Inicio del consumo" value={inicio} onChange={setInicio} maxima={hoyIso()} />
          <CampoFecha label="Fin del consumo" value={fin} onChange={setFin} maxima={hoyIso()} />
          {error && <Text variant="bodySmall">{error}</Text>}
          <Button mode="contained" onPress={guardarFactura}>Guardar factura</Button>
          <Button onPress={() => { setError(null); setPaso('aparatos'); }}>Ahora no</Button>
        </>
      ) : paso === 'meta' ? (
        <>
          <Text variant="titleMedium">Tu meta (opcional)</Text>
          {PORCENTAJES.map((p) => (
            <Button key={p} mode={pct === p ? 'contained-tonal' : 'outlined'} onPress={() => setPct(p)}>{`${p} %`}</Button>
          ))}
          {meta && <Text variant="titleMedium">{`Meta: ${formatEnergy(meta.kwh)} · ${formatMoney(meta.pesos)}`}</Text>}
          {error && <Text variant="bodySmall">{error}</Text>}
          <Button mode="contained" onPress={guardarMeta}>Empezar mi periodo</Button>
          <Button onPress={() => { setError(null); setPaso('aparatos'); }}>Ahora no</Button>
        </>
      ) : (
        <>
          <Text variant="titleMedium">Tus primeros aparatos</Text>
          <Text variant="bodyLarge">
            Agrega los aparatos que más usas desde el catálogo y empieza a registrar su uso.
          </Text>
          <Button mode="contained" icon="plus" onPress={() => terminar(true)}>Abrir el catálogo</Button>
          <Button onPress={() => terminar(false)}>Lo haré después</Button>
        </>
      )}
    </Formulario>
  );
}
