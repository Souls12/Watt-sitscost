import { useState } from 'react';
import { router } from 'expo-router';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { Formulario } from '@/components/Formulario';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { correoValido } from '@/lib/validacion';

export default function Entrar() {
  const { aviso, limpiarAviso } = useSesion();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar() {
    limpiarAviso();
    if (!correoValido(correo) || !clave) return setError('Escribe tu correo y tu contraseña.');
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: clave });
    setEnviando(false);
    if (!error) return;
    setError(
      error.code === 'email_not_confirmed'
        ? 'Aún no confirmas tu correo. Abre el enlace que te enviamos.'
        : 'Correo o contraseña incorrectos.',
    );
  }

  return (
    <Formulario titulo="Watt'sitcost">
      <Text variant="titleLarge">Entrar</Text>
      {aviso && <Text variant="bodyMedium">{aviso}</Text>}
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
        autoComplete="current-password"
      />
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
      <Button mode="contained" onPress={entrar} loading={enviando} disabled={enviando}>
        Entrar
      </Button>
      <Button onPress={() => router.push('/recuperar')}>Olvidé mi contraseña</Button>
      <Button mode="outlined" onPress={() => router.push('/registro')}>
        Crear cuenta
      </Button>
    </Formulario>
  );
}
