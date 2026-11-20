import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { FlatList, View } from 'react-native';
import { Button, List, Text } from 'react-native-paper';
import { Pantalla } from '@/components/Pantalla';
import { type Aparato, useColoresTipo } from '@/lib/aparatos';
import { formatPower } from '@/lib/format';
import { supabase } from '@/lib/supabase';

export default function Aparatos() {
  const [lista, setLista] = useState<Aparato[]>([]);
  const colores = useColoresTipo();

  // Los archivados no se listan: dejan de aceptar uso, pero siguen en la base de datos.
  useFocusEffect(
    useCallback(() => {
      supabase
        .from('aparatos')
        .select('*')
        .is('archivado_en', null)
        .order('creado_en', { ascending: false })
        .then(({ data }) => setLista((data ?? []) as Aparato[]));
    }, []),
  );

  return (
    <Pantalla titulo="Aparatos">
      <FlatList
        data={lista}
        keyExtractor={(a) => String(a.id)}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListHeaderComponent={
          <View style={{ padding: 16 }}>
            <Button mode="contained" icon="plus" onPress={() => router.push('/catalogo')}>
              Agregar aparato
            </Button>
          </View>
        }
        ListEmptyComponent={
          <Text style={{ padding: 16 }}>Aún no tienes aparatos. Búscalos en el catálogo o registra uno propio.</Text>
        }
        renderItem={({ item: a }) => (
          <List.Item
            title={a.cantidad > 1 ? `${a.nombre} ×${a.cantidad}` : a.nombre}
            description={`${a.tipo} · ${formatPower(a.potencia_w)}${a.uso_constante ? ' · uso constante' : ''}`}
            left={() => <View style={{ width: 6, alignSelf: 'stretch', borderRadius: 3, backgroundColor: colores[a.tipo] ?? '#8A8578', marginLeft: 16 }} />}
            onPress={() => router.push({ pathname: '/aparato', params: { id: String(a.id) } })}
          />
        )}
      />
    </Pantalla>
  );
}
