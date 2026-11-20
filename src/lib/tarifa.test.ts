import { leerTarifa, revisarTarifa } from './tarifa';

test('tarifa: debe ser mayor que 0 y pide confirmar sobre $3.000', () => {
  expect(revisarTarifa('650,5')).toBe('ok');
  expect(revisarTarifa('3000')).toBe('ok');
  expect(revisarTarifa('3.001')).toBe('confirmar');
  expect(revisarTarifa('0')).toBe('invalida');
  expect(revisarTarifa('abc')).toBe('invalida');
  expect(revisarTarifa('')).toBe('invalida');
  expect(leerTarifa('1.250,5')).toBe(1250.5);
});
