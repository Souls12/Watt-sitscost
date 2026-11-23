import { leerNumero } from './numero';

test('leerNumero: coma decimal, punto de miles o decimal', () => {
  expect(leerNumero('250.5')).toBe(250.5);
  expect(leerNumero('1.250')).toBe(1250);
  expect(leerNumero('1.250.000')).toBe(1250000);
  expect(leerNumero('1.25')).toBe(1.25);
  expect(leerNumero('650,5')).toBe(650.5);
  expect(leerNumero('1.250,5')).toBe(1250.5);
  expect(leerNumero(' 12 ')).toBe(12);
  expect(leerNumero('')).toBeNaN();
  expect(leerNumero('1,2,3')).toBeNaN();
  expect(leerNumero('abc')).toBeNaN();
});
