import { type TextStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutUp, useReducedMotion } from 'react-native-reanimated';
import { fonts } from '@/theme';
import { curva, dur } from './tokens';

type Props = { valor: string; style?: TextStyle };

// Cifra que cambia: la anterior sale hacia arriba, la nueva entra desde abajo (el número "sube").
// El cambio se identifica por `key`; ambas animaciones corren en el hilo de UI.
// Las dos cifras coexisten durante el cambio: el contenedor debe tener altura fija si importa el layout.
export function Cifra({ valor, style }: Props) {
  const reducir = useReducedMotion();
  const entra = reducir ? FadeIn.duration(dur.corta) : SlideInDown.duration(dur.media).easing(curva.sale);
  const sale = reducir ? FadeOut.duration(dur.corta) : SlideOutUp.duration(dur.media).easing(curva.entra);
  return (
    <Animated.Text
      key={valor}
      entering={entra}
      exiting={sale}
      style={[{ fontFamily: fonts.slab, fontSize: 40 }, style]}
    >
      {valor}
    </Animated.Text>
  );
}
