import type { Aparato } from '@/lib/aparatos';

/** Los aparatos más reportados (últimos registros) primero; a igualdad, el orden original. */
export function ordenarPorUso<T extends { id: number }>(aparatos: T[], registros: { aparato_id: number }[]): T[] {
  const n = new Map<number, number>();
  for (const r of registros) n.set(r.aparato_id, (n.get(r.aparato_id) ?? 0) + 1);
  return [...aparatos].sort((a, b) => (n.get(b.id) ?? 0) - (n.get(a.id) ?? 0));
}

/** kWh de un reporte: W x cantidad x h / 1000 (misma fórmula que la vista consumo_calculado). */
export const kwhDeReporte = (a: Pick<Aparato, 'potencia_w' | 'cantidad'>, horas: number) =>
  (a.potencia_w * a.cantidad * horas) / 1000;
