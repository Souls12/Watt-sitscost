import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, List } from 'react-native-paper';
import { Formulario } from '@/components/Formulario';
import { type Referencia, criterioTexto, nombreReferencia } from '@/lib/aparatos';
import { formatPower } from '@/lib/format';
import { supabase } from '@/lib/supabase';

// Ficha de un aparato de referencia: potencia, criterio y fuente.
export default function Ficha() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [r, setR] = useState<Referencia | null>(null);

  useEffect(() => {
    supabase
      .from('aparatos_referencia')
      .select('*')
      .eq('id', Number(id))
      .single()
      .then(({ data }) => setR(data as Referencia | null));
  }, [id]);

  return (
    <Formulario titulo={r ? nombreReferencia(r) : 'Ficha'}>
      {r && (
        <>
          <List.Item title={formatPower(r.potencia_w)} description={criterioTexto[r.criterio_potencia]} left={(p) => <List.Icon {...p} icon="flash" />} />
          <List.Item title={r.tipo} description="Tipo" left={(p) => <List.Icon {...p} icon="shape" />} />
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
      <Button onPress={() => router.back()}>Volver</Button>
    </Formulario>
  );
}
