import { leerTarifa, revisarTarifa, tarifaNeta } from './tarifa';

test('tarifa: debe ser mayor que 0 y pide confirmar sobre $3.000', () => {
  expect(revisarTarifa('650,5')).toBe('ok');
  expect(revisarTarifa('3000')).toBe('ok');
  expect(revisarTarifa('3.001')).toBe('confirmar');
  expect(revisarTarifa('0')).toBe('invalida');
  expect(revisarTarifa('abc')).toBe('invalida');
  expect(revisarTarifa('')).toBe('invalida');
  expect(leerTarifa('1.250,5')).toBe(1250.5);
});

test('tarifaNeta: tarifa menos subsidio, en es-CO', () => {
  expect(tarifaNeta('1.012,35', '405')).toBe('607,35');
  expect(tarifaNeta('812,4', '')).toBe('812,4');
  expect(tarifaNeta('300', '300')).toBeNull();
  expect(tarifaNeta('abc', '')).toBeNull();
  expect(tarifaNeta('800', 'x')).toBeNull();
});
