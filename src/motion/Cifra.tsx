import { type TextStyle, View, useWindowDimensions } from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutUp, useReducedMotion } from 'react-native-reanimated';
import { curva, dur } from './tokens';

type Props = { valor: string; style?: TextStyle };

// Cifra que cambia: la anterior sale hacia arriba, la nueva entra desde abajo (el número "sube").
// El cambio se identifica por `key`; ambas animaciones corren en el hilo de UI.
// Las dos cifras coexisten durante el cambio: el contenedor reserva una línea (minHeight) que crece con la escala de fuente.
export function Cifra({ valor, style }: Props) {
  const { fonts: tipos } = useTheme();
  const { fontScale } = useWindowDimensions();
  const reducir = useReducedMotion();
  const entra = reducir ? FadeIn.duration(dur.corta) : SlideInDown.duration(dur.media).easing(curva.sale);
  const sale = reducir ? FadeOut.duration(dur.corta) : SlideOutUp.duration(dur.media).easing(curva.entra);
  return (
    <View style={{ minHeight: (tipos.displaySmall.lineHeight ?? 48) * fontScale }}>
      <Animated.Text key={valor} entering={entra} exiting={sale} style={[tipos.displaySmall, style]}>
        {valor}
      </Animated.Text>
    </View>
  );
}
