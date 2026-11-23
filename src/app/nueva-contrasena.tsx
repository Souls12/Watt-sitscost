import { useState } from 'react';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { Formulario } from '@/components/Formulario';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { contrasenaValida } from '@/lib/validacion';

// Se llega aquí con el enlace de "Olvidé mi contraseña" (sesión temporal de recuperación).
export default function NuevaContrasena() {
  const { terminarRecuperacion } = useSesion();
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function guardar() {
    if (!contrasenaValida(clave))
      return setError('La contraseña necesita al menos 8 caracteres, con una letra y un número.');
    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password: clave });
    setEnviando(false);
    if (error) return setError('No pudimos guardarla. Pide un enlace nuevo e intenta otra vez.');
    terminarRecuperacion();
  }

  return (
    <Formulario titulo="Contraseña nueva">
      <Text variant="bodyLarge">Elige tu contraseña nueva.</Text>
      <TextInput
        label="Contraseña nueva"
        mode="outlined"
        value={clave}
        onChangeText={setClave}
        secureTextEntry
        autoComplete="new-password"
      />
      <HelperText type={error ? 'error' : 'info'} visible>
        {error ?? 'Al menos 8 caracteres, con una letra y un número.'}
      </HelperText>
      <Button mode="contained" onPress={guardar} loading={enviando} disabled={enviando}>
        Guardar
      </Button>
    </Formulario>
  );
}
