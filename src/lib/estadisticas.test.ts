import { cambio, metaRango, porAparato, porDia, rangoMes, semanasDelMes, type Registro } from './estadisticas';

const r = (fecha: string, aparato_id: number, kwh: number, horas = 1): Registro => ({ fecha, aparato_id, nombre: `A${aparato_id}`, tipo: 'Otro', horas, kwh, costo: kwh * 800 });

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
