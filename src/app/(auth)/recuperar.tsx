import { useState } from 'react';
import { router } from 'expo-router';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { Formulario } from '@/components/Formulario';
import { supabase } from '@/lib/supabase';
import { urlRetorno } from '@/lib/sesion';
import { correoValido } from '@/lib/validacion';

export default function Recuperar() {
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (!correoValido(correo)) return setError('Revisa el formato del correo.');
    setError(null);
    setEnviando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(correo.trim(), { redirectTo: urlRetorno });
    setEnviando(false);
    if (error) return setError('No pudimos enviar el correo. Intenta en unos minutos.');
    setEnviado(true);
  }

  return (
    <Formulario titulo="Recuperar contraseña" atras="/entrar">
      {enviado ? (
        <Text variant="bodyLarge">
          Si hay una cuenta con ese correo, te llegó un enlace. Ábrelo en este teléfono para elegir una
          contraseña nueva.
        </Text>
      ) : (
        <>
          <Text variant="bodyLarge">Te enviamos un enlace para elegir una contraseña nueva.</Text>
          <TextInput
            label="Correo"
            mode="outlined"
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
          <Button mode="contained" onPress={enviar} loading={enviando} disabled={enviando}>
            Enviar enlace
          </Button>
        </>
      )}
      <Button onPress={() => router.replace('/entrar')}>Volver</Button>
    </Formulario>
  );
}
