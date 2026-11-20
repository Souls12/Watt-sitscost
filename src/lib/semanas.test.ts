import { rangoSemana, seriesPorAparato } from './semanas';

test('rango de semana', () => {
  expect(rangoSemana('2026-11-16', '2026-11-22')).toBe('16–22 nov');
  expect(rangoSemana('2026-11-30', '2026-12-06')).toBe('30 nov–6 dic');
});

test('series rellenan con 0 las semanas sin consumo', () => {
  const w = (semana: string) => ({ semana, desde: semana, hasta: semana, kwh: 0, presupuesto: 0, parcial: false, es_actual: false });
  const s = seriesPorAparato([w('2026-11-09'), w('2026-11-16')], [{ semana: '2026-11-16', aparato_id: 1, nombre: 'A', tipo: 'Otro', kwh: 2 }]);
  expect(s[0].puntos).toEqual([{ x: 0, kwh: 0 }, { x: 1, kwh: 2 }]);
});
