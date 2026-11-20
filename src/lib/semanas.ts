export type Semana = { semana: string; desde: string; hasta: string; kwh: number; presupuesto: number; parcial: boolean; es_actual: boolean };
export type PuntoAparato = { semana: string; aparato_id: number; nombre: string; tipo: string; kwh: number };
export type SerieAparato = { aparato_id: number; nombre: string; tipo: string; puntos: { x: number; kwh: number }[] };

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "16–22 nov" (o "30 nov–6 dic" si cruza de mes). */
export function rangoSemana(desde: string, hasta: string): string {
  const [d, h] = [desde, hasta].map((f) => ({ dia: Number(f.slice(8)), mes: MESES[Number(f.slice(5, 7)) - 1] }));
  return d.mes === h.mes ? `${d.dia}–${h.dia} ${h.mes}` : `${d.dia} ${d.mes}–${h.dia} ${h.mes}`;
}

/** Una serie por aparato sobre TODAS las semanas (0 donde no hubo consumo), para que compartan eje x. */
export function seriesPorAparato(semanas: Semana[], puntos: PuntoAparato[]): SerieAparato[] {
  const porAparato = new Map<number, SerieAparato>();
  for (const p of puntos) {
    if (!porAparato.has(p.aparato_id)) porAparato.set(p.aparato_id, { aparato_id: p.aparato_id, nombre: p.nombre, tipo: p.tipo, puntos: [] });
  }
  return [...porAparato.values()].map((s) => ({
    ...s,
    puntos: semanas.map((w, x) => ({
      x,
      kwh: puntos.find((p) => p.aparato_id === s.aparato_id && p.semana === w.semana)?.kwh ?? 0,
    })),
  }));
}
