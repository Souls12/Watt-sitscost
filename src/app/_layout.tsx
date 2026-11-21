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
import { PaperProvider, useTheme } from 'react-native-paper';
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
  const { colors } = useTheme();
  if (cargando || (session && bienvenida === null)) return null;
  return (
    // Transiciones Material deliberadas: las pantallas empujadas entran desde la derecha; el cambio de sesión es un fundido.
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={!!session && !recuperando && bienvenida === false}>
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="cuenta" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="tarifa" />
        <Stack.Screen name="catalogo" />
        <Stack.Screen name="referencia" />
        <Stack.Screen name="aparato" />
        <Stack.Screen name="avisos" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="revision" />
      </Stack.Protected>
      <Stack.Protected guard={!!session && !recuperando && bienvenida === true}>
        <Stack.Screen name="bienvenida" options={{ animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Screen name="tutorial" />
      <Stack.Protected guard={!!session && recuperando}>
        <Stack.Screen name="nueva-contrasena" options={{ animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      </Stack.Protected>
    </Stack>
  );
}
