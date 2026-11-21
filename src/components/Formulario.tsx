import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView } from 'react-native';
import type { Href } from 'expo-router';
import { Pantalla } from '@/components/Pantalla';

// Pantalla de formulario: encabezado del almanaque y contenido desplazable sobre el teclado.
// Edge-to-edge (SDK 58): la ventana ya no se redimensiona sola; KeyboardAvoidingView con 'padding' sube el contenido según el evento del teclado.
export function Formulario({ titulo, atras, children }: { titulo: string; atras?: Href; children: ReactNode }) {
  return (
    <Pantalla titulo={titulo} atras={atras}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}
