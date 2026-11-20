import { contrasenaValida, correoValido } from './validacion';

test('correo: acepta un formato normal y rechaza los incompletos', () => {
  expect(correoValido('ana.perez@correo.com.co')).toBe(true);
  expect(correoValido('  ana@x.co ')).toBe(true);
  expect(correoValido('ana@correo')).toBe(false);
  expect(correoValido('ana correo@x.co')).toBe(false);
  expect(correoValido('@x.co')).toBe(false);
  expect(correoValido('')).toBe(false);
});

test('contraseña: al menos 8 caracteres con una letra y un número', () => {
  expect(contrasenaValida('casa1234')).toBe(true);
  expect(contrasenaValida('casa123')).toBe(false);
  expect(contrasenaValida('casacasa')).toBe(false);
  expect(contrasenaValida('12345678')).toBe(false);
});
