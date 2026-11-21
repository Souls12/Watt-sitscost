import { useState } from 'react';
import { GuiaFactura } from '@/components/GuiaFactura';
import { Button, Dialog, HelperText, Portal, Text, TextInput } from 'react-native-paper';
import { revisarTarifa } from '@/lib/tarifa';

// Campo de tarifa con su validación. `validar(seguir)` llama `seguir` si el valor es válido
// (y, si supera $3.000/kWh, solo después de que el usuario confirme en el diálogo).
export function useTarifa(conGuia = true) {
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendiente, setPendiente] = useState<(() => void) | null>(null);
  const [verGuia, setVerGuia] = useState(false);

  function validar(seguir: () => void) {
    const r = revisarTarifa(texto);
    if (r === 'invalida') return setError('Escribe un valor mayor que 0, por ejemplo 650,5.');
    setError(null);
    if (r === 'ok') return seguir();
    setPendiente(() => seguir);
  }

  const campo = (
    <>
      <TextInput
        label="Valor por kWh (en pesos)"
        mode="outlined"
        value={texto}
        onChangeText={setTexto}
        keyboardType="decimal-pad"
        left={<TextInput.Affix text="$" />}
      />
      <HelperText type={error ? 'error' : 'info'} visible>
        {error ?? 'Lo encuentras en tu factura. Puedes cambiarlo cuando suba.'}
      </HelperText>
      {conGuia && <Button icon="help-circle-outline" onPress={() => setVerGuia((v) => !v)} contentStyle={{ minHeight: 48 }}>
        ¿Dónde la encuentro?
      </Button>}
      {conGuia && verGuia && <GuiaFactura foco="tarifa" />}
      <Portal>
        <Dialog visible={!!pendiente} onDismiss={() => setPendiente(null)}>
          <Dialog.Title>¿Es correcto?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              ${texto} por kWh es un valor muy alto. Revisa que no sea el total de tu factura.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPendiente(null)}>Corregir</Button>
            <Button
              onPress={() => {
                const f = pendiente;
                setPendiente(null);
                f?.();
              }}
            >
              Sí, es correcto
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
  return { texto, setTexto, campo, validar };
}
