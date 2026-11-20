import { aIso, deIso, fechaLarga } from './fechas';

test('ida y vuelta sin desfase de día', () => {
  expect(aIso(deIso('2026-11-20'))).toBe('2026-11-20');
  expect(aIso(deIso('2026-01-01'))).toBe('2026-01-01');
});
test('fecha hablada en español', () => {
  expect(fechaLarga('2026-11-20')).toBe('20 de noviembre de 2026');
  expect(fechaLarga('2026-03-05', false)).toBe('5 de marzo');
});
