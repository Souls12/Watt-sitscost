import { buscarFichas, referenciaTipica, usoTipico } from './bienvenida';

const r = (id: number, tipo: string, potencia_w: number) => ({ id, tipo, potencia_w });

test('referenciaTipica: elige la ficha de potencia mediana del tipo', () => {
  const refs = [r(1, 'Televisor', 330), r(2, 'Televisor', 75), r(3, 'Televisor', 150), r(4, 'Plancha', 1200)];
  expect(referenciaTipica(refs, 'Televisor')?.id).toBe(3);
  expect(referenciaTipica(refs, 'Plancha')?.id).toBe(4);
});

test('referenciaTipica: null si el tipo no tiene fichas', () => {
  expect(referenciaTipica([r(1, 'Plancha', 1200)], 'Ventilador')).toBeNull();
});

test('usoTipico: nevera constante de 8 h, tipo desconocido 1 h', () => {
  expect(usoTipico('Nevera/Nevecón')).toEqual({ horas: 8, constante: true });
  expect(usoTipico('Otro')).toEqual({ horas: 1, constante: false });
});

test('buscarFichas: ignora tildes y mayúsculas; vacío no devuelve nada', () => {
  const f = [
    { tipo: 'Ducha eléctrica', marca: null, modelo: null },
    { tipo: 'Televisor', marca: 'Samsung', modelo: 'UN43' },
  ];
  expect(buscarFichas(f, 'ELECTRICA')).toEqual([f[0]]);
  expect(buscarFichas(f, 'sams')).toEqual([f[1]]);
  expect(buscarFichas(f, '  ')).toEqual([]);
});
