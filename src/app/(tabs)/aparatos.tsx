import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { FlatList, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { entra } from '@/motion';
import { Button, List, Text } from 'react-native-paper';
import { AgregarAparatos } from '@/components/AgregarAparatos';
import { IconoTipo } from '@/components/IconoTipo';
import { Pantalla } from '@/components/Pantalla';
import type { Aparato } from '@/lib/aparatos';
import { formatPower } from '@/lib/format';
import { supabase } from '@/lib/supabase';

export default function Aparatos() {
  const [lista, setLista] = useState<Aparato[]>([]);

  // Los archivados no se listan: dejan de aceptar uso, pero siguen en la base de datos.
  const cargar = useCallback(() => {
    supabase
      .from('aparatos')
      .select('*')
      .is('archivado_en', null)
      .order('creado_en', { ascending: false })
      .then(({ data }) => setLista((data ?? []) as Aparato[]));
  }, []);
  useFocusEffect(cargar);

  return (
    <Pantalla titulo="Aparatos">
      <FlatList
        data={lista}
        keyExtractor={(a) => String(a.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 16 }}
        ListHeaderComponent={
          <View style={{ padding: 16, gap: 12 }}>
            <Text variant="titleLarge">Agregar aparatos</Text>
            <AgregarAparatos onCambio={cargar} />
            <Button icon="book-open-variant" contentStyle={{ minHeight: 48 }} onPress={() => router.push('/catalogo')}>
              Ver el catálogo completo
            </Button>
            <Text variant="titleLarge" style={{ marginTop: 8 }}>Tus aparatos</Text>
          </View>
        }
        ListEmptyComponent={
          <Text variant="bodyLarge" style={{ paddingHorizontal: 16 }}>
            Aún no tienes aparatos. Con ellos calculamos cuánto gasta cada cosa en casa.
          </Text>
        }
        renderItem={({ item: a, index }) => (
          <Animated.View entering={entra(index)}>
          <List.Item
            title={a.cantidad > 1 ? `${a.nombre} ×${a.cantidad}` : a.nombre}
            description={`${a.tipo} · ${formatPower(a.potencia_w)}${a.uso_constante ? ' · uso constante' : ''}`}
            left={() => <View style={{ marginLeft: 16, justifyContent: 'center' }}><IconoTipo tipo={a.tipo} /></View>}
            onPress={() => router.push({ pathname: '/aparato', params: { id: String(a.id) } })}
          />
          </Animated.View>
        )}
      />
    </Pantalla>
  );
}
