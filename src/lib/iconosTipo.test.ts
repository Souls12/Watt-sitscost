import { ICONOS_TIPO, iconoTipo } from './iconosTipo';

test('iconoTipo: cada tipo tiene icono y lo desconocido usa el de Otro', () => {
  expect(Object.keys(ICONOS_TIPO)).toHaveLength(9);
  expect(iconoTipo('Televisor')).toBe('television');
  expect(iconoTipo('Microondas')).toBe(ICONOS_TIPO.Otro);
});
