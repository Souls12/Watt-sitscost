import { calcularMeta, validarFactura } from './factura';

const hoy = '2026-11-20';
test('rechaza consumo no positivo, futuro e inicio >= fin', () => {
  expect(validarFactura('0', '2026-10-01', '2026-10-30', hoy).ok).toBe(false);
  expect(validarFactura('100', '2026-11-01', '2026-11-21', hoy).ok).toBe(false);
  expect(validarFactura('100', '2026-10-30', '2026-10-30', hoy).ok).toBe(false);
  expect(validarFactura('100,5', '2026-10-01', '2026-10-30', hoy)).toEqual({
    ok: true,
    valor: { kwh_facturado: 100.5, inicio: '2026-10-01', fin: '2026-10-30' },
  });
});
test('meta en kWh y pesos', () => {
  expect(calcularMeta(200, 10, 800)).toEqual({ kwh: 180, pesos: 144000 });
});
