import { formatEnergy, formatMoney, formatPower, formatDuration } from './format';

describe('formatEnergy (entrada en kWh)', () => {
  it('muestra kWh con coma decimal', () => expect(formatEnergy(5.8)).toBe('5,8 kWh'));
  it('muestra Wh por debajo de 0,1 kWh', () => expect(formatEnergy(0.04)).toBe('40 Wh'));
  it('0,1 kWh ya es kWh', () => expect(formatEnergy(0.1)).toBe('0,1 kWh'));
  it('cero', () => expect(formatEnergy(0)).toBe('0 Wh'));
});

describe('formatMoney', () => {
  it('aproxima a la decena con punto de miles', () => expect(formatMoney(4867)).toBe('≈ $4.870'));
  it('redondea hacia abajo', () => expect(formatMoney(4863)).toBe('≈ $4.860'));
  it('cifras pequeñas', () => expect(formatMoney(12)).toBe('≈ $10'));
});

describe('formatPower', () => {
  it('potencia en W', () => expect(formatPower(1500)).toBe('1.500 W'));
  it('redondea', () => expect(formatPower(60.4)).toBe('60 W'));
});

describe('formatDuration (entrada en minutos)', () => {
  it('horas y minutos', () => expect(formatDuration(90)).toBe('1 h 30 min'));
  it('solo horas', () => expect(formatDuration(120)).toBe('2 h'));
  it('solo minutos', () => expect(formatDuration(45)).toBe('45 min'));
});
