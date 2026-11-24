import React from 'react';
import { supabase } from '@/lib/supabase';
import { formatEnergy, formatMoney } from '@/lib/format';
import { WidgetResumen, type DatosWidget } from './WidgetResumen';

export async function datosWidget(): Promise<DatosWidget> {
  try {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) return { titulo: "Watt'sitcost", cifra: 'Entra', detalle: 'Abre la app para ver tu consumo', racha: 0 };
    const [p, h, r] = await Promise.all([
      supabase.from('panel_hoy').select('*').maybeSingle(),
      supabase.rpc('consumo_hogar'),
      supabase.rpc('racha_dias'),
    ]);
    if (p.error || h.error || r.error) throw new Error('fallo');
    const racha = Number(r.data ?? 0);
    const d = p.data as Record<string, any> | null;
    if (d) {
      const kwh = Number(d.presupuesto_hoy);
      return { titulo: 'Hoy puedes gastar', cifra: formatEnergy(kwh), detalle: formatMoney(kwh * Number(d.tarifa_kwh)), racha };
    }
    const fila = h.data?.[0];
    return { titulo: 'Consumo del mes', cifra: formatEnergy(Number(fila?.kwh ?? 0)), detalle: formatMoney(Number(fila?.costo ?? 0)), racha };
  } catch {
    return { titulo: "Watt'sitcost", cifra: 'Sin conexión', detalle: 'Reintentaremos pronto', racha: 0 };
  }
}

export function renderResumen(d: DatosWidget) {
  return { light: <WidgetResumen {...d} oscuro={false} />, dark: <WidgetResumen {...d} oscuro /> };
}
