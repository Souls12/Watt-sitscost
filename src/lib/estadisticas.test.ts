import { cambio, consejos, proyectar, metaRango, porAparato, porDia, rangoMes, semanasDelMes, type Registro } from './estadisticas';

const r = (fecha: string, aparato_id: number, kwh: number, horas = 1, auto = false): Registro => ({ id: 0, fecha, aparato_id, nombre: `A${aparato_id}`, tipo: 'Otro', horas, kwh, costo: kwh * 800, auto });

test('semanas lunes–domingo recortadas al mes', () => {
  // Noviembre 2026 empieza en domingo.
  const s = semanasDelMes(2026, 10);
  expect(s[0]).toEqual({ desde: '2026-11-01', hasta: '2026-11-01' });
  expect(s[1]).toEqual({ desde: '2026-11-02', hasta: '2026-11-08' });
  expect(s.at(-1)).toEqual({ desde: '2026-11-30', hasta: '2026-11-30' });
  expect(rangoMes(2028, 1).hasta).toBe('2028-02-29');
});

test('agrupa por aparato y por día', () => {
  const rs = [r('2026-11-02', 1, 2, 3), r('2026-11-03', 1, 1, 2), r('2026-11-03', 2, 5), r('2026-10-31', 2, 9)];
  const nov = rangoMes(2026, 10);
  expect(porAparato(rs, nov).map((f) => [f.aparato_id, f.kwh, f.horas])).toEqual([[2, 5, 1], [1, 3, 5]]);
  const d = porDia(rs, { desde: '2026-11-02', hasta: '2026-11-04' });
  expect(d.map((x) => x.kwh)).toEqual([2, 6, 0]);
});

test('meta repartida por día y cambio', () => {
  const p = [{ inicio: '2026-11-01', fin: '2026-11-10', meta_kwh: 100 }];
  expect(metaRango(p, { desde: '2026-11-09', hasta: '2026-11-12' })).toBe(20);
  expect(metaRango(p, { desde: '2026-12-01', hasta: '2026-12-02' })).toBeNull();
  expect(cambio(85, 100)).toBe(-15);
  expect(cambio(5, 0)).toBeNull();
});

test('proyección y consejos', () => {
  expect(proyectar(30, 10, 30)).toBe(90);
  expect(proyectar(5, 0, 30)).toBe(0);
  // Aire: 2 kWh en 2 h cada día de los 10 → 1 h menos al día = 1 kWh × 30 días. La nevera (auto) no entra.
  const rs = Array.from({ length: 10 }, (_, i) => r(`2026-11-${String(i + 1).padStart(2, '0')}`, 1, 2, 2)).concat(r('2026-11-01', 2, 9, 24, true));
  const c = consejos(rs, rangoMes(2026, 10), '2026-11-10');
  expect(c).toHaveLength(1);
  expect(c[0].menosHoras).toBe(1);
  expect(c[0].kwhMes).toBeCloseTo(30);
  expect(c[0].pesosMes).toBeCloseTo(24000);
});
