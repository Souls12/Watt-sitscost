import { Easing } from 'react-native-reanimated';

// Duraciones en ms. Ver docs/diseno/movimiento.md.
export const dur = { corta: 150, media: 280, luna: 400, hoja: 520 } as const;

// Curvas: salida (algo llega y se asienta) y entrada (algo se va).
export const curva = {
  sale: Easing.bezier(0.2, 0, 0, 1),
  entra: Easing.bezier(0.3, 0, 0.8, 0.15),
  transforma: Easing.bezier(0.4, 0, 0.2, 1),
};

// Resorte con rebote leve, solo para la racha.
export const resorte = { racha: { damping: 12, stiffness: 180, mass: 0.8 } } as const;
