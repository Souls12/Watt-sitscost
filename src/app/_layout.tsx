import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { ZillaSlab_500Medium, ZillaSlab_700Bold } from '@expo-google-fonts/zilla-slab';
import {
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
} from '@expo-google-fonts/atkinson-hyperlegible';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { ReduceMotion, ReducedMotionConfig } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { darkTheme, lightTheme } from '@/theme';
import { SesionProvider, useSesion } from '@/lib/sesion';
import { AjustesProvider, useBienvenida, useTema } from '@/lib/ajustes';
import { temaOscuro } from '@/lib/tema';

export default function RootLayout() {
  const [loaded] = useFonts({
    ZillaSlab_500Medium,
    ZillaSlab_700Bold,
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
  });
  if (!loaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* Las animaciones siempre se reproducen (decisión del usuario): Reanimated por omisión sigue el ajuste del sistema. */}
        <ReducedMotionConfig mode={ReduceMotion.Never} />
        <SesionProvider>
          <AjustesProvider>
            <Tematizado />
          </AjustesProvider>
        </SesionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Tematizado() {
  const [tema] = useTema();
  const dark = temaOscuro(tema, useColorScheme());
  return (
    <PaperProvider theme={dark ? darkTheme : lightTheme}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Rutas />
    </PaperProvider>
  );
}

// Sin sesión solo se ve la entrada; con el enlace de recuperación, solo la nueva contraseña.
function Rutas() {
  const { session, cargando, recuperando } = useSesion();
  const { bienvenida } = useBienvenida();
  if (cargando) return null;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session && !recuperando && !bienvenida}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="cuenta" />
        <Stack.Screen name="tarifa" />
        <Stack.Screen name="catalogo" />
        <Stack.Screen name="referencia" />
        <Stack.Screen name="aparato" />
        <Stack.Screen name="avisos" />
        <Stack.Screen name="revision" />
      </Stack.Protected>
      <Stack.Protected guard={!!session && !recuperando && bienvenida}>
        <Stack.Screen name="bienvenida" />
      </Stack.Protected>
      <Stack.Screen name="tutorial" />
      <Stack.Protected guard={!!session && recuperando}>
        <Stack.Screen name="nueva-contrasena" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
