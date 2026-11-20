import { validarAparato } from './validacion';

const ok = { nombre: 'Nevera', potencia: '150', cantidad: '1', usoHoras: '', usoConstante: false };

test('aparato: acepta potencia con coma decimal y devuelve números', () => {
  expect(validarAparato({ ...ok, potencia: '89,5', usoHoras: '1,5' })).toEqual({
    ok: true,
    valor: { nombre: 'Nevera', potencia_w: 89.5, cantidad: 1, uso_tipico_horas: 1.5, uso_constante: false },
  });
});

test('aparato: rechaza potencia no positiva, cantidad no entera y uso de más de 24 h', () => {
  expect(validarAparato({ ...ok, potencia: '0' }).ok).toBe(false);
  expect(validarAparato({ ...ok, potencia: 'abc' }).ok).toBe(false);
  expect(validarAparato({ ...ok, cantidad: '2,5' }).ok).toBe(false);
  expect(validarAparato({ ...ok, usoHoras: '25' }).ok).toBe(false);
  expect(validarAparato({ ...ok, nombre: '  ' }).ok).toBe(false);
});

test('aparato: el uso constante exige un uso típico', () => {
  expect(validarAparato({ ...ok, usoConstante: true }).ok).toBe(false);
  expect(validarAparato({ ...ok, usoConstante: true, usoHoras: '24' }).ok).toBe(true);
});
