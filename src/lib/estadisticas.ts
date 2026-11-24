// Estadísticas del mes calendario a partir de los registros de uso (consumo_calculado). Funciones puras.
export type Registro = { id: number; fecha: string; aparato_id: number; nombre: string; tipo: string; horas: number; kwh: number; costo: number; auto: boolean };
export type PeriodoMeta = { inicio: string; fin: string; meta_kwh: number };
export type FilaAparato = { aparato_id: number; nombre: string; tipo: string; horas: number; kwh: number; costo: number };
export type Rango = { desde: string; hasta: string };

const dos = (n: number) => String(n).padStart(2, '0');
const ms = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
export const sumarDias = (f: string, n: number) => iso(ms(f) + n * 86400000);
export const diasEntre = (a: string, b: string) => Math.round((ms(b) - ms(a)) / 86400000);
/** 0 = lunes … 6 = domingo. */
export const diaSemana = (f: string) => (new Date(ms(f)).getUTCDay() + 6) % 7;

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

/** Primer y último día del mes (mes 0–11). */
export function rangoMes(anio: number, mes: number): Rango {
  const fin = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  return { desde: `${anio}-${dos(mes + 1)}-01`, hasta: `${anio}-${dos(mes + 1)}-${dos(fin)}` };
}

/** Semanas lunes–domingo recortadas al mes. */
export function semanasDelMes(anio: number, mes: number): Rango[] {
  const { desde, hasta } = rangoMes(anio, mes);
  const out: Rango[] = [];
  for (let d = desde; d <= hasta; ) {
    const fin = sumarDias(d, 6 - diaSemana(d));
    out.push({ desde: d, hasta: fin < hasta ? fin : hasta });
    d = sumarDias(fin, 1);
  }
  return out;
}

export const dentro = (r: Registro, { desde, hasta }: Rango) => r.fecha >= desde && r.fecha <= hasta;
const total = (rs: Registro[], k: 'kwh' | 'costo') => rs.reduce((s, r) => s + r[k], 0);

/** kWh y pesos de un rango. */
export function totales(rs: Registro[], rango: Rango) {
  const sel = rs.filter((r) => dentro(r, rango));
  return { kwh: total(sel, 'kwh'), costo: total(sel, 'costo') };
}

/** Consumo por aparato en el rango, de mayor a menor kWh. */
export function porAparato(rs: Registro[], rango: Rango): FilaAparato[] {
  const m = new Map<number, FilaAparato>();
  for (const r of rs) {
    if (!dentro(r, rango)) continue;
    const f = m.get(r.aparato_id) ?? { aparato_id: r.aparato_id, nombre: r.nombre, tipo: r.tipo, horas: 0, kwh: 0, costo: 0 };
    f.horas += r.horas;
    f.kwh += r.kwh;
    f.costo += r.costo;
    m.set(r.aparato_id, f);
  }
  return [...m.values()].sort((a, b) => b.kwh - a.kwh);
}

/** kWh por tipo de aparato, de mayor a menor. */
export function porTipo(rs: Registro[], rango: Rango): { tipo: string; kwh: number }[] {
  const m = new Map<string, number>();
  for (const r of rs) if (dentro(r, rango)) m.set(r.tipo, (m.get(r.tipo) ?? 0) + r.kwh);
  return [...m.entries()].map(([tipo, kwh]) => ({ tipo, kwh })).sort((a, b) => b.kwh - a.kwh);
}

/** kWh de cada día del rango (incluye días en 0). */
export function porDia(rs: Registro[], rango: Rango): { fecha: string; kwh: number }[] {
  const n = diasEntre(rango.desde, rango.hasta) + 1;
  const dias = Array.from({ length: n }, (_, i) => ({ fecha: sumarDias(rango.desde, i), kwh: 0 }));
  for (const r of rs) if (dentro(r, rango)) dias[diasEntre(rango.desde, r.fecha)].kwh += r.kwh;
  return dias;
}

/** Meta del día: la meta del periodo repartida por igual entre sus días; null si el día no cae en un periodo. */
export function metaDia(periodos: PeriodoMeta[], fecha: string): number | null {
  const p = periodos.find((x) => fecha >= x.inicio && fecha <= x.fin);
  return p ? p.meta_kwh / (diasEntre(p.inicio, p.fin) + 1) : null;
}

/** Suma de la meta diaria del rango; null si ningún día tiene meta. */
export function metaRango(periodos: PeriodoMeta[], { desde, hasta }: Rango): number | null {
  let s: number | null = null;
  for (let d = desde; d <= hasta; d = sumarDias(d, 1)) {
    const m = metaDia(periodos, d);
    if (m !== null) s = (s ?? 0) + m;
  }
  return s;
}

/** Cambio en % de `antes` a `ahora`; null si antes es 0. */
export const cambio = (ahora: number, antes: number) => (antes > 0 ? Math.round(((ahora - antes) / antes) * 100) : null);

/** Proyección lineal: si en `transcurridos` días llevas `llevado`, cuánto llevarás en `total` días. */
export const proyectar = (llevado: number, transcurridos: number, total: number) => (transcurridos > 0 ? (llevado / transcurridos) * total : 0);

export type Consejo = { aparato_id: number; nombre: string; tipo: string; menosHoras: number; kwhMes: number; pesosMes: number };

/**
 * Hasta 3 consejos para los aparatos manuales que más gastan: usar `menosHoras` menos cada día que se usan
 * (1 h, o la mitad del uso promedio si es menor) y cuánto se ahorraría en 30 días al ritmo de uso del rango.
 * Los aparatos con registro automático (la nevera) se omiten: no se pueden "usar menos horas".
 */
export function consejos(rs: Registro[], rango: Rango, hoy: string): Consejo[] {
  const fin = hoy < rango.hasta ? hoy : rango.hasta;
  const dias = diasEntre(rango.desde, fin) + 1;
  if (dias <= 0) return [];
  const autos = new Set(rs.filter((r) => r.auto).map((r) => r.aparato_id));
  return porAparato(rs.filter((r) => !autos.has(r.aparato_id)), { desde: rango.desde, hasta: fin })
    .filter((f) => f.horas > 0 && f.kwh > 0)
    .slice(0, 3)
    .map((f) => {
      const usados = new Set(rs.filter((r) => r.aparato_id === f.aparato_id && dentro(r, rango)).map((r) => r.fecha)).size;
      const menosHoras = Math.min(1, f.horas / usados / 2);
      const factor = menosHoras * (usados / dias) * 30;
      return { aparato_id: f.aparato_id, nombre: f.nombre, tipo: f.tipo, menosHoras, kwhMes: (f.kwh / f.horas) * factor, pesosMes: (f.costo / f.horas) * factor };
    });
}
