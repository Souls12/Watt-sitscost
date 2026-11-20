export const META_AVISO = 40; // % de reducción por encima del cual se pide confirmación
export const PORCENTAJES = [5, 10, 15, 20] as const;

const aFecha = (t: string) => (/^\d{4}-\d{2}-\d{2}$/.test(t.trim()) ? t.trim() : null);

/** Valida lo tecleado (fechas AAAA-MM-DD); la base de datos repite las reglas y además rechaza cruces. */
export function validarFactura(kwh: string, inicio: string, fin: string, hoy: string) {
  const k = Number(kwh.trim().replace(',', '.'));
  const i = aFecha(inicio);
  const f = aFecha(fin);
  if (!(k > 0)) return { ok: false as const, error: 'El consumo facturado debe ser mayor que cero.' };
  if (!i || !f || isNaN(Date.parse(i)) || isNaN(Date.parse(f))) return { ok: false as const, error: 'Escribe las fechas como AAAA-MM-DD.' };
  if (f > hoy) return { ok: false as const, error: 'El periodo de la factura no puede ser futuro.' };
  if (i >= f) return { ok: false as const, error: 'La fecha de inicio debe ser anterior a la de fin.' };
  return { ok: true as const, valor: { kwh_facturado: k, inicio: i, fin: f } };
}

/** Meta en kWh y en pesos para un porcentaje de reducción sobre la factura. */
export function calcularMeta(kwhFacturado: number, porcentaje: number, tarifa: number) {
  const kwh = Math.round(kwhFacturado * (1 - porcentaje / 100) * 100) / 100;
  return { kwh, pesos: kwh * tarifa };
}
