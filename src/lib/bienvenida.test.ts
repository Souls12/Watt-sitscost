import { referenciaTipica } from './bienvenida';

const r = (id: number, tipo: string, potencia_w: number) => ({ id, tipo, potencia_w });

test('referenciaTipica: elige la ficha de potencia mediana del tipo', () => {
  const refs = [r(1, 'Televisor', 330), r(2, 'Televisor', 75), r(3, 'Televisor', 150), r(4, 'Plancha', 1200)];
  expect(referenciaTipica(refs, 'Televisor')?.id).toBe(3);
  expect(referenciaTipica(refs, 'Plancha')?.id).toBe(4);
});

test('referenciaTipica: null si el tipo no tiene fichas', () => {
  expect(referenciaTipica([r(1, 'Plancha', 1200)], 'Ventilador')).toBeNull();
});
