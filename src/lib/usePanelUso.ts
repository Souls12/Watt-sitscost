import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Aparato } from '@/lib/aparatos';
import { kwhDeReporte } from '@/lib/uso';

export type Panel = { kwh: number; costo: number; racha: number };

/** Consumo del mes, racha y reporte optimista. Los números reales los calcula Postgres. */
export function usePanelUso() {
  const [panel, setPanel] = useState<Panel>({ kwh: 0, costo: 0, racha: 0 });

  const cargar = useCallback(async () => {
    const [h, r] = await Promise.all([supabase.rpc('consumo_hogar'), supabase.rpc('racha_dias')]);
    const fila = h.data?.[0];
    setPanel({ kwh: Number(fila?.kwh ?? 0), costo: Number(fila?.costo ?? 0), racha: Number(r.data ?? 0) });
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
      await cargar();
      return null;
    },
    [panel, cargar],
  );

  return { panel, cargar, reportar };
}
