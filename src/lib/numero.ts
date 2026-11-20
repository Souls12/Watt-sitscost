/** Lee un número tecleado en es-CO: la coma siempre es decimal; un punto seguido de exactamente 3 dígitos es de miles; si no, un solo punto es decimal. NaN si no es número. */
export function leerNumero(texto: string): number {
  const t = texto.trim();
  const limpio = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : /^\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, '') : t;
  return /^\d+(\.\d+)?$/.test(limpio) ? Number(limpio) : NaN;
}
