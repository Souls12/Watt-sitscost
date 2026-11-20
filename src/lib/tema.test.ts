import { temaOscuro } from './tema';

describe('temaOscuro', () => {
  it('respeta la elección y, en "sistema", sigue al dispositivo', () => {
    expect(temaOscuro('oscuro', 'light')).toBe(true);
    expect(temaOscuro('claro', 'dark')).toBe(false);
    expect(temaOscuro('sistema', 'dark')).toBe(true);
    expect(temaOscuro('sistema', null)).toBe(false);
  });
});
