const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "16–22 nov" (o "30 nov–6 dic" si cruza de mes). */
export function rangoSemana(desde: string, hasta: string): string {
  const [d, h] = [desde, hasta].map((f) => ({ dia: Number(f.slice(8)), mes: MESES[Number(f.slice(5, 7)) - 1] }));
  return d.mes === h.mes ? `${d.dia}–${h.dia} ${h.mes}` : `${d.dia} ${d.mes}–${h.dia} ${h.mes}`;
}
