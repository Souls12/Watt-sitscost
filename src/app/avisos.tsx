import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { Formulario } from '@/components/Formulario';
import { type Aviso } from '@/lib/avisos';
import { supabase } from '@/lib/supabase';
import { almanaque } from '@/theme';

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });

// Bandeja de avisos. Al abrirla, los no leídos quedan leídos (se resaltan solo esta vez).
export default function Avisos() {
  const [avisos, setAvisos] = useState<Aviso[] | null>(null);

  async function cargar() {
    const { data } = await supabase.from('avisos').select('*').order('creado_en', { ascending: false });
    setAvisos((data ?? []) as Aviso[]);
  }

  useEffect(() => {
    cargar().then(() => supabase.from('avisos').update({ leido_en: new Date().toISOString() }).is('leido_en', null));
  }, []);

  // Ficha corregida: el usuario decide si copia la potencia nueva a su aparato.
  async function decidir(a: Aviso, actualizar: boolean) {
    if (actualizar) await supabase.rpc('actualizar_copia', { p_aviso: a.id });
    else await supabase.from('avisos').update({ atendido_en: new Date().toISOString() }).eq('id', a.id);
    cargar();
  }

  return (
    <Formulario titulo="Avisos">
      {avisos?.length === 0 && <Text>No tienes avisos por ahora.</Text>}
      {avisos?.map((a) => (
        <Card
          key={a.id}
          mode="outlined"
          style={!a.leido_en ? { borderLeftWidth: 6, borderLeftColor: almanaque.amarillo } : undefined}
        >
          <Card.Title title={a.titulo} subtitle={fecha(a.creado_en)} />
          <Card.Content>
            <Text>{a.cuerpo}</Text>
          </Card.Content>
          {a.tipo === 'ficha_corregida' && !a.atendido_en && (
            <Card.Actions>
              <Button onPress={() => decidir(a, false)}>Dejar como está</Button>
              <Button mode="contained" onPress={() => decidir(a, true)}>
                Actualizar mi copia
              </Button>
            </Card.Actions>
          )}
        </Card>
      ))}
      <View style={{ height: 8 }} />
      <Button onPress={() => router.back()}>Volver</Button>
    </Formulario>
  );
}
