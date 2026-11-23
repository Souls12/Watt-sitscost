import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Button, List, SegmentedButtons, Text } from 'react-native-paper';
import { Formulario } from '@/components/Formulario';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { useEsAdministrador } from '@/lib/avisos';
import { useCifraPrincipal, useTema, type Cifra, type Tema } from '@/lib/ajustes';

type Perfil = {
  nombre: string;
  estrato: number;
  ciudad: { nombre: string; estado: string } | null;
  empresa: { nombre: string; estado: string } | null;
};

const enRevision = (x: { estado: string } | null) => (x?.estado === 'propuesta' ? ' (en revisión)' : '');

export default function Cuenta() {
  const { session } = useSesion();
  const [cifra, setCifra] = useCifraPrincipal();
  const [tema, setTema] = useTema();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const administrador = useEsAdministrador();

  useEffect(() => {
    supabase
      .from('perfiles')
      .select('nombre, estrato, ciudad:ciudades(nombre, estado), empresa:empresas(nombre, estado)')
      .single()
      .then(({ data }) => setPerfil(data as Perfil | null));
  }, []);

  return (
    <Formulario titulo="Mi cuenta" atras="/">
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
      <Text variant="labelLarge">Cifra principal</Text>
      <SegmentedButtons
        value={cifra}
        onValueChange={(v) => setCifra(v as Cifra)}
        buttons={[{ value: 'kwh', label: 'kWh' }, { value: 'pesos', label: 'Pesos' }]}
      />
      <Text variant="labelLarge">Tema</Text>
      <SegmentedButtons
        value={tema}
        onValueChange={(v) => setTema(v as Tema)}
        buttons={[{ value: 'sistema', label: 'Sistema' }, { value: 'claro', label: 'Claro' }, { value: 'oscuro', label: 'Oscuro' }]}
      />
      <Button mode="outlined" icon="help-circle-outline" onPress={() => router.push('/tutorial')}>
        Ayuda y tutorial
      </Button>
      <Button mode="outlined" icon="cash" onPress={() => router.push('/tarifa')}>
        Mi tarifa
      </Button>
      {administrador && (
        <Button mode="outlined" icon="clipboard-check-outline" onPress={() => router.push('/revision')}>
          Revisar propuestas
        </Button>
      )}
      {/* scope local: cierra solo este teléfono; las sesiones de otros teléfonos siguen abiertas. */}
      <Button mode="outlined" icon="logout" onPress={() => supabase.auth.signOut({ scope: 'local' })}>
        Cerrar sesión
      </Button>
      <Button onPress={() => router.back()}>Volver</Button>
    </Formulario>
  );
}
