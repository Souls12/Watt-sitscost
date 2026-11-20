import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { FlatList, View } from 'react-native';
import { Button, List, Searchbar } from 'react-native-paper';
import { Pantalla } from '@/components/Pantalla';
import { type Referencia, nombreReferencia, useColoresTipo } from '@/lib/aparatos';
import { formatPower } from '@/lib/format';
import { supabase } from '@/lib/supabase';

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Catálogo de referencia: 94 fichas, se filtran en el teléfono por tipo, marca o modelo.
export default function Catalogo() {
  const [todos, setTodos] = useState<Referencia[]>([]);
  const [q, setQ] = useState('');
  const colores = useColoresTipo();

  useEffect(() => {
    supabase
      .from('aparatos_referencia')
      .select('id, tipo, marca, modelo, potencia_w')
      .eq('estado', 'aprobada')
      .order('tipo')
      .order('marca')
      .then(({ data }) => setTodos((data ?? []) as Referencia[]));
  }, []);

  const visibles = useMemo(() => {
    const t = sinTildes(q.trim());
    return todos.filter((r) => sinTildes(`${r.tipo} ${r.marca ?? 'generico'} ${r.modelo ?? ''}`).includes(t));
  }, [todos, q]);

  return (
    <Pantalla titulo="Catálogo">
      <View style={{ padding: 16, gap: 8 }}>
        <Searchbar placeholder="Tipo, marca o modelo" value={q} onChangeText={setQ} />
        <Button icon="pencil-plus" onPress={() => router.push('/aparato')}>
          No está: registrar uno propio
        </Button>
      </View>
      <FlatList
        data={visibles}
        keyExtractor={(r) => String(r.id)}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item: r }) => (
          <List.Item
            title={nombreReferencia(r)}
            description={`${r.tipo} · ${formatPower(r.potencia_w)}`}
            left={() => <View style={{ width: 6, alignSelf: 'stretch', borderRadius: 3, backgroundColor: colores[r.tipo] ?? '#8A8578', marginLeft: 16 }} />}
            onPress={() => router.push({ pathname: '/referencia', params: { id: String(r.id) } })}
          />
        )}
      />
    </Pantalla>
  );
}
