import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type Referencia = {
  id: number;
  tipo: string;
  marca: string | null;
  modelo: string | null;
  potencia_w: number;
  criterio_potencia: 'nominal' | 'maximo_rango' | 'maximo_publicado';
  consumo_kwh_mes_etiqueta: number | null;
  capacidad: string | null;
  fuente: string;
};

export type Aparato = {
  id: number;
  referencia_id: number | null;
  nombre: string;
  tipo: string;
  potencia_w: number;
  cantidad: number;
  uso_tipico_horas: number | null;
  uso_constante: boolean;
  archivado_en: string | null;
};

export const criterioTexto = {
  nominal: 'Potencia nominal publicada',
  maximo_rango: 'Máximo de un rango (regla pesimista)',
  maximo_publicado: 'Máximo publicado (regla pesimista)',
} as const;

export const nombreReferencia = (r: Referencia) => (r.marca ? `${r.marca} ${r.modelo}` : `${r.tipo} (genérico)`);

// Un color fijo por tipo de aparato, de la tabla tipos_aparato: igual en listas y registros.
let tiposCache: Record<string, string> | null = null;
export function useColoresTipo(): Record<string, string> {
  const [colores, setColores] = useState(tiposCache ?? {});
  useEffect(() => {
    if (tiposCache) return;
    supabase
      .from('tipos_aparato')
      .select('nombre, color')
      .then(({ data }) => {
        if (!data) return;
        const c: Record<string, string> = Object.fromEntries(data.map((t) => [t.nombre, t.color]));
        tiposCache = c;
        setColores(c);
      });
  }, []);
  return colores;
}
