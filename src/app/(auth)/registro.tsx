import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Button, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { Formulario } from '@/components/Formulario';
import { useTarifa } from '@/components/CampoTarifa';
import { leerTarifa } from '@/lib/tarifa';
import { Selector, type Eleccion, type Opcion } from '@/components/Selector';
import { supabase } from '@/lib/supabase';
import { urlRetorno } from '@/lib/sesion';
import { contrasenaValida, correoValido } from '@/lib/validacion';

const completa = (e: Eleccion) => !!e && ('id' in e || e.propuesta.trim().length > 0);

// El trigger private.crear_perfil lee estos datos y crea el perfil (y la propuesta, si la hay).
const datosDe = (campo: 'ciudad' | 'empresa', e: Eleccion) =>
  e && 'id' in e ? { [`${campo}_id`]: e.id } : { [`${campo}_propuesta`]: e?.propuesta.trim() };

export default function Registro() {
  const [paso, setPaso] = useState<1 | 2 | 3 | 'listo'>(1);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [ciudad, setCiudad] = useState<Eleccion>(null);
  const [empresa, setEmpresa] = useState<Eleccion>(null);
  const [estrato, setEstrato] = useState('');
  const [ciudades, setCiudades] = useState<Opcion[]>([]);
  const [empresas, setEmpresas] = useState<Opcion[]>([]);
  const { texto: tarifa, campo: campoTarifa, validar: validarTarifa } = useTarifa();
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

  function seguir2() {
    if (!completa(ciudad) || !estrato || !completa(empresa))
      return setError('Elige tu ciudad, tu estrato y tu empresa proveedora.');
    setError(null);
    setPaso(3);
  }

  async function crear() {
    setEnviando(true);
    const { data, error } = await supabase.auth.signUp({
      email: correo.trim(),
      password: clave,
      options: {
        emailRedirectTo: urlRetorno,
        data: { nombre: nombre.trim(), estrato: Number(estrato), tarifa_kwh: leerTarifa(tarifa), ...datosDe('ciudad', ciudad), ...datosDe('empresa', empresa) },
      },
    });
    setEnviando(false);
    // Sin confirmación de correo, signUp ya trae la sesión y el guard de _layout lleva a la bienvenida (perfil nuevo).
    if (!error) return data.session ? undefined : setPaso('listo');
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
    <Formulario titulo={paso === 1 ? 'Tu cuenta' : paso === 2 ? 'Dónde vives' : 'Tu tarifa'}>
      <Text variant="labelLarge">Paso {paso} de 3</Text>
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
          <Button icon="help-circle-outline" onPress={() => router.push('/tutorial')}>
            ¿Cómo funciona?
          </Button>
          <Button onPress={() => router.replace('/entrar')}>Ya tengo cuenta</Button>
        </>
      ) : paso === 2 ? (
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
          <Button mode="contained" onPress={seguir2}>
            Seguir
          </Button>
          <Button onPress={() => setPaso(1)}>Atrás</Button>
        </>
      ) : (
        <>
          {campoTarifa}
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
          <Button mode="contained" onPress={() => validarTarifa(crear)} loading={enviando} disabled={enviando}>
            Crear cuenta
          </Button>
          <Button onPress={() => setPaso(2)}>Atrás</Button>
        </>
      )}
    </Formulario>
  );
}
