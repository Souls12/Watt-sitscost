import { leerNumero } from './numero';

export const TARIFA_CONFIRMAR = 3000; // $/kWh por encima de esto se pide confirmación

/** Lee el valor tecleado ("650,5" o "1.250"); null si no es un número. */
export function leerTarifa(texto: string): number | null {
  const v = leerNumero(texto);
  return /^\d+(\.\d{1,2})?$/.test(String(v)) ? v : null;
}

/** 'ok' | 'invalida' (no es número o no es mayor que 0) | 'confirmar' (supera $3.000/kWh). */
export function revisarTarifa(texto: string): 'ok' | 'invalida' | 'confirmar' {
  const v = leerTarifa(texto);
  if (v === null || v <= 0) return 'invalida';
  return v > TARIFA_CONFIRMAR ? 'confirmar' : 'ok';
}

/** Tarifa efectiva en $/kWh = tarifa − subsidio (subsidio vacío = 0), con coma decimal; null si no se puede calcular o no queda mayor que 0. */
export function tarifaNeta(tarifa: string, subsidio: string): string | null {
  const t = leerNumero(tarifa);
  const s = subsidio.trim() === '' ? 0 : leerNumero(subsidio);
  if (Number.isNaN(t) || Number.isNaN(s)) return null;
  const neta = Math.round((t - s) * 100) / 100;
  return neta > 0 ? String(neta).replace('.', ',') : null;
}
