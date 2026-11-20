import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button, Text } from 'react-native-paper';
import { supabase } from '@/lib/supabase';
import { formatEnergy } from '@/lib/format';
import { HojaArrancada } from '@/motion';

type Cierre = {
  inicio: string; fin_real: string; porcentaje: number; meta_kwh: number; kwh_facturado: number;
  kwh_calculado: number; meta_superada: boolean; factura_cierre_id: number;
  porcentaje_menos: number; porcentaje_mas: number;
};
type Opcion = 'mantener' | 'mas' | 'menos';
const ETIQUETA = { mantener: 'Mantener', mas: 'Ahorrar más', menos: 'Ahorrar menos' } as const;

// Cierre del periodo: facturado frente a meta y a calculado, y una sola pregunta que inicia el nuevo ciclo.
export function CierrePeriodo({ onListo }: { onListo: () => void }) {
  const [c, setC] = useState<Cierre | null>(null);
  const [opcion, setOpcion] = useState<Opcion>('mantener');
  const [arrancada, setArrancada] = useState(false);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      supabase.from('cierre_pendiente').select('*').maybeSingle().then(({ data }) => {
        const d = data as Cierre | null;
        setC(d);
        if (d) setOpcion(d.meta_superada ? 'menos' : 'mantener'); // superada: "ahorrar menos" preseleccionado
      });
    }, []),
  );
  if (!c) return null;

  const pct = { mantener: Number(c.porcentaje), mas: Number(c.porcentaje_mas), menos: Number(c.porcentaje_menos) };
  const empezar = async () => {
    const { error: e } = await supabase.from('periodos').insert({ factura_base_id: c.factura_cierre_id, porcentaje: pct[opcion] });
    setError(!!e);
    if (!e) setArrancada(true);
  };
  const dif = Number(c.kwh_facturado) - Number(c.meta_kwh);

  return (
    <HojaArrancada arrancada={arrancada} onFin={() => { setC(null); onListo(); }}>
      <View style={{ gap: 8, paddingVertical: 8 }}>
        <Text variant="titleMedium">Cerraste tu periodo</Text>
        <Text>
          {dif <= 0
            ? `Lo lograste: tu factura fue de ${formatEnergy(c.kwh_facturado)}, ${formatEnergy(-dif)} por debajo de tu meta de ${formatEnergy(c.meta_kwh)}.`
            : `Tu factura fue de ${formatEnergy(c.kwh_facturado)} y tu meta era ${formatEnergy(c.meta_kwh)}. Faltaron ${formatEnergy(dif)}; cada periodo es una nueva oportunidad.`}
        </Text>
        <Text>{`Lo que calculamos con tus reportes fue ${formatEnergy(c.kwh_calculado)}.`}</Text>
        <Text variant="labelLarge">¿Cómo quieres tu próximo periodo?</Text>
        {(['mantener', 'mas', 'menos'] as const).map((o) => (
          <Button key={o} mode={opcion === o ? 'contained-tonal' : 'outlined'} onPress={() => setOpcion(o)}>
            {`${ETIQUETA[o]} (${pct[o]} %)`}
          </Button>
        ))}
        {error && <Text variant="bodySmall">No pudimos crear el nuevo periodo.</Text>}
        <Button mode="contained" onPress={empezar}>Empezar nuevo periodo</Button>
      </View>
    </HojaArrancada>
  );
}
