import { rangoSemana } from './semanas';

test('rango de semana', () => {
  expect(rangoSemana('2026-11-16', '2026-11-22')).toBe('16–22 nov');
  expect(rangoSemana('2026-11-30', '2026-12-06')).toBe('30 nov–6 dic');
});
