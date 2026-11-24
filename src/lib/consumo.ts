import { supabase } from '@/lib/supabase';
import type { PeriodoMeta, Registro } from '@/lib/estadisticas';

/** Registros de uso con su kWh y costo calculados, entre dos fechas (inclusive). Incluye aparatos archivados. */
export async function cargarRegistros(desde: string, hasta: string): Promise<Registro[]> {
  const [c, a] = await Promise.all([
    supabase.from('consumo_calculado').select('id, fecha, aparato_id, horas, kwh, costo, origen').gte('fecha', desde).lte('fecha', hasta),
    supabase.from('aparatos').select('id, nombre, tipo'),
  ]);
  if (c.error || a.error) throw c.error ?? a.error;
  const ap = new Map((a.data ?? []).map((x) => [x.id, x]));
  return (c.data ?? []).map((x) => ({
    id: Number(x.id),
    fecha: String(x.fecha),
    aparato_id: Number(x.aparato_id),
    nombre: ap.get(x.aparato_id)?.nombre ?? 'Aparato borrado',
    tipo: ap.get(x.aparato_id)?.tipo ?? 'Otro',
    horas: Number(x.horas),
    kwh: Number(x.kwh),
    costo: Number(x.costo),
    auto: x.origen === 'automatico',
  }));
}

/** Periodos con meta (abiertos y cerrados). */
export async function cargarPeriodos(): Promise<PeriodoMeta[]> {
  const { data, error } = await supabase.from('periodos').select('inicio, fin_estimado, fin_real, meta_kwh');
  if (error) throw error;
  return (data ?? []).map((p) => ({ inicio: p.inicio, fin: p.fin_real ?? p.fin_estimado, meta_kwh: Number(p.meta_kwh) }));
}
