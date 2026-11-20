import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCifraPrincipal } from '@/lib/ajustes';
import type { Aparato } from '@/lib/aparatos';
import { kwhDeReporte } from '@/lib/uso';

export type Panel = { kwh: number; costo: number; racha: number };
export type PanelHoy = {
  estado: string;
  meta_kwh: number;
  consumido_periodo: number;
  consumido_hoy: number;
  presupuesto_hoy: number;
  excedente: number;
  meta_alcanzada: boolean;
  dias_restantes: number;
  tarifa_kwh: number;
  racha: number;
};
export type DiaAlmanaque = { fecha: string; kwh: number; fraccion: number; reportado: boolean; es_hoy: boolean };

/** Panel de hoy, almanaque del periodo y reporte optimista. Los números reales los calcula Postgres. */
export function usePanelUso() {
  const [panel, setPanel] = useState<Panel>({ kwh: 0, costo: 0, racha: 0 });
  const [hoy, setHoy] = useState<PanelHoy | null>(null);
  const [dias, setDias] = useState<DiaAlmanaque[]>([]);
  const [cifra] = useCifraPrincipal();

  /** Si algo falla conserva lo que ya se muestra y devuelve el mensaje. */
  const cargar = useCallback(async (): Promise<string | null> => {
    const [h, r, p, a] = await Promise.all([
      supabase.rpc('consumo_hogar'),
      supabase.rpc('racha_dias'),
      supabase.from('panel_hoy').select('*').maybeSingle(),
      supabase.rpc('almanaque_periodo'),
    ]);
    if (h.error || r.error || p.error || a.error) return 'No pudimos actualizar tus datos. Revisa tu conexión.';
    const fila = h.data?.[0];
    setPanel({ kwh: Number(fila?.kwh ?? 0), costo: Number(fila?.costo ?? 0), racha: Number(r.data ?? 0) });
    const d = p.data as Record<string, any> | null;
    setHoy(
      d && {
        estado: String(d.estado),
        meta_kwh: Number(d.meta_kwh),
        consumido_periodo: Number(d.consumido_periodo),
        consumido_hoy: Number(d.consumido_hoy),
        presupuesto_hoy: Number(d.presupuesto_hoy),
        excedente: Number(d.excedente),
        meta_alcanzada: !!d.meta_alcanzada,
        dias_restantes: Number(d.dias_restantes),
        tarifa_kwh: Number(d.tarifa_kwh),
        racha: Number(d.racha),
      },
    );
    setDias(
      ((a.data ?? []) as Record<string, any>[]).map((x) => ({
        fecha: String(x.fecha),
        kwh: Number(x.kwh),
        fraccion: Number(x.fraccion),
        reportado: !!x.reportado,
        es_hoy: !!x.es_hoy,
      })),
    );
    return null;
  }, []);

  /** Sube la cifra y la racha al instante; si Postgres rechaza, vuelve atrás y devuelve el mensaje. */
  const reportar = useCallback(
    async (a: Aparato, horas: number): Promise<string | null> => {
      const antes = panel;
      setPanel((p) => ({ ...p, kwh: p.kwh + kwhDeReporte(a, horas), racha: Math.max(p.racha, 1) }));
      const { error } = await supabase.from('registros_uso').insert({ aparato_id: a.id, horas });
      if (error) {
        setPanel(antes);
        return error.message;
      }
      return await cargar();
    },
    [panel, cargar],
  );

  return { panel, hoy, dias, cifra, cargar, reportar };
}
