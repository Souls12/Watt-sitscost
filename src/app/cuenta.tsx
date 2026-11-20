import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Button, List } from 'react-native-paper';
import { Formulario } from '@/components/Formulario';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';

type Perfil = {
  nombre: string;
  estrato: number;
  ciudad: { nombre: string; estado: string } | null;
  empresa: { nombre: string; estado: string } | null;
};

const enRevision = (x: { estado: string } | null) => (x?.estado === 'propuesta' ? ' (en revisión)' : '');

export default function Cuenta() {
  const { session } = useSesion();
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  useEffect(() => {
    supabase
      .from('perfiles')
      .select('nombre, estrato, ciudad:ciudades(nombre, estado), empresa:empresas(nombre, estado)')
      .single()
      .then(({ data }) => setPerfil(data as Perfil | null));
  }, []);

  return (
    <Formulario titulo="Mi cuenta">
      <List.Item title={perfil?.nombre ?? ' '} description={session?.user.email} left={(p) => <List.Icon {...p} icon="account" />} />
      <List.Item
        title={`${perfil?.ciudad?.nombre ?? ''}${enRevision(perfil?.ciudad ?? null)}`}
        description={perfil ? `Estrato ${perfil.estrato}` : ' '}
        left={(p) => <List.Icon {...p} icon="map-marker" />}
      />
      <List.Item
        title={`${perfil?.empresa?.nombre ?? ''}${enRevision(perfil?.empresa ?? null)}`}
        description="Empresa proveedora"
        left={(p) => <List.Icon {...p} icon="flash" />}
      />
      {/* scope local: cierra solo este teléfono; las sesiones de otros teléfonos siguen abiertas. */}
      <Button mode="outlined" icon="logout" onPress={() => supabase.auth.signOut({ scope: 'local' })}>
        Cerrar sesión
      </Button>
      <Button onPress={() => router.back()}>Volver</Button>
    </Formulario>
  );
}
