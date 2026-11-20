import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Button, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { Formulario } from '@/components/Formulario';
import { Selector, type Eleccion, type Opcion } from '@/components/Selector';
import { supabase } from '@/lib/supabase';
import { urlRetorno } from '@/lib/sesion';
import { contrasenaValida, correoValido } from '@/lib/validacion';

const completa = (e: Eleccion) => !!e && ('id' in e || e.propuesta.trim().length > 0);

// El trigger private.crear_perfil lee estos datos y crea el perfil (y la propuesta, si la hay).
const datosDe = (campo: 'ciudad' | 'empresa', e: Eleccion) =>
  e && 'id' in e ? { [`${campo}_id`]: e.id } : { [`${campo}_propuesta`]: e?.propuesta.trim() };

export default function Registro() {
  const [paso, setPaso] = useState<1 | 2 | 'listo'>(1);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [ciudad, setCiudad] = useState<Eleccion>(null);
  const [empresa, setEmpresa] = useState<Eleccion>(null);
  const [estrato, setEstrato] = useState('');
  const [ciudades, setCiudades] = useState<Opcion[]>([]);
  const [empresas, setEmpresas] = useState<Opcion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    supabase
      .from('ciudades')
      .select('id, nombre, detalle:departamento')
      .eq('estado', 'aprobada')
      .order('nombre')
      .then(({ data }) => setCiudades(data ?? []));
    supabase
      .from('empresas')
      .select('id, nombre')
      .eq('estado', 'aprobada')
      .order('nombre')
      .then(({ data }) => setEmpresas(data ?? []));
  }, []);

  function seguir() {
    if (!nombre.trim()) return setError('Escribe tu nombre.');
    if (!correoValido(correo)) return setError('Revisa el formato del correo.');
    if (!contrasenaValida(clave))
      return setError('La contraseña necesita al menos 8 caracteres, con una letra y un número.');
    setError(null);
    setPaso(2);
  }

  async function crear() {
    if (!completa(ciudad) || !estrato || !completa(empresa))
      return setError('Elige tu ciudad, tu estrato y tu empresa proveedora.');
    setError(null);
    setEnviando(true);
    const { error } = await supabase.auth.signUp({
      email: correo.trim(),
      password: clave,
      options: {
        emailRedirectTo: urlRetorno,
        data: { nombre: nombre.trim(), estrato: Number(estrato), ...datosDe('ciudad', ciudad), ...datosDe('empresa', empresa) },
      },
    });
    setEnviando(false);
    if (!error) return setPaso('listo');
    setError(
      error.code === 'weak_password'
        ? 'La contraseña necesita al menos 8 caracteres, con una letra y un número.'
        : 'No pudimos crear la cuenta. Intenta de nuevo.',
    );
  }

  if (paso === 'listo')
    return (
      <Formulario titulo="Revisa tu correo">
        <Text variant="bodyLarge">
          Te enviamos un enlace a {correo.trim()}. Ábrelo para confirmar tu cuenta y luego entra con tu
          contraseña.
        </Text>
        <Button mode="contained" onPress={() => router.replace('/entrar')}>
          Ir a entrar
        </Button>
      </Formulario>
    );

  return (
    <Formulario titulo={paso === 1 ? 'Tu cuenta' : 'Dónde vives'}>
      <Text variant="labelLarge">Paso {paso} de 2</Text>
      {paso === 1 ? (
        <>
          <TextInput label="Nombre" mode="outlined" value={nombre} onChangeText={setNombre} autoComplete="name" />
          <TextInput
            label="Correo"
            mode="outlined"
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextInput
            label="Contraseña"
            mode="outlined"
            value={clave}
            onChangeText={setClave}
            secureTextEntry
            autoComplete="new-password"
          />
          <HelperText type={error ? 'error' : 'info'} visible>
            {error ?? 'Al menos 8 caracteres, con una letra y un número.'}
          </HelperText>
          <Button mode="contained" onPress={seguir}>
            Seguir
          </Button>
          <Button onPress={() => router.back()}>Ya tengo cuenta</Button>
        </>
      ) : (
        <>
          <Selector
            etiqueta="Ciudad"
            noEncuentro="No encuentro mi ciudad"
            opciones={ciudades}
            eleccion={ciudad}
            onCambio={setCiudad}
          />
          <Text variant="labelLarge">Estrato</Text>
          <SegmentedButtons
            value={estrato}
            onValueChange={setEstrato}
            buttons={['1', '2', '3', '4', '5', '6'].map((n) => ({ value: n, label: n }))}
          />
          <Selector
            etiqueta="Empresa proveedora"
            noEncuentro="No encuentro mi empresa"
            opciones={empresas}
            eleccion={empresa}
            onCambio={setEmpresa}
          />
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
          <Button mode="contained" onPress={crear} loading={enviando} disabled={enviando}>
            Crear cuenta
          </Button>
          <Button onPress={() => setPaso(1)}>Atrás</Button>
        </>
      )}
    </Formulario>
  );
}
