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
