// Aparatos comunes de la configuración inicial: un toque agrega el aparato con potencia, cantidad y uso típicos.
// Los valores de uso son estimaciones razonables y se pueden editar después en Aparatos.
export type TipoComun = {
  tipo: string; // nombre en tipos_aparato / aparatos_referencia
  nombre: string; // como lo dice la gente
  horas: number; // uso típico al día
  constante?: boolean; // se registra solo cada día
};

export const TIPOS_COMUNES: TipoComun[] = [
  // shortcut: la nevera enciende el compresor ~1/3 del día; 8 h en vez de 24 h, afinar con datos reales.
  { tipo: 'Nevera/Nevecón', nombre: 'Nevera', horas: 8, constante: true },
  { tipo: 'Televisor', nombre: 'Televisor', horas: 4 },
  { tipo: 'Ventilador', nombre: 'Ventilador', horas: 6 },
  { tipo: 'Licuadora', nombre: 'Licuadora', horas: 0.25 },
  { tipo: 'Ducha eléctrica', nombre: 'Ducha eléctrica', horas: 0.25 },
  { tipo: 'Lavadora', nombre: 'Lavadora', horas: 1 },
  { tipo: 'Plancha', nombre: 'Plancha', horas: 0.5 },
  { tipo: 'Aire acondicionado', nombre: 'Aire acondicionado', horas: 6 },
];

type Ref = { id: number; tipo: string; potencia_w: number };

/** La ficha de potencia mediana del tipo (ni la más baja ni la más alta); null si no hay fichas. */
export function referenciaTipica<T extends Ref>(refs: T[], tipo: string): T | null {
  const l = refs.filter((r) => r.tipo === tipo).sort((a, b) => a.potencia_w - b.potencia_w || a.id - b.id);
  return l.length ? l[Math.floor((l.length - 1) / 2)] : null;
}

/** Uso típico por defecto de un tipo: el de la lista común, o 1 h al día si no está. */
export function usoTipico(tipo: string): { horas: number; constante: boolean } {
  const t = TIPOS_COMUNES.find((c) => c.tipo === tipo);
  return { horas: t?.horas ?? 1, constante: !!t?.constante };
}

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Fichas cuyo tipo, marca o modelo contiene lo escrito (sin tildes ni mayúsculas); las genéricas cuentan como "genérico". */
export function buscarFichas<T extends { tipo: string; marca: string | null; modelo: string | null }>(fichas: T[], q: string): T[] {
  const t = sinTildes(q.trim());
  return t ? fichas.filter((r) => sinTildes(`${r.tipo} ${r.marca ?? 'generico'} ${r.modelo ?? ''}`).includes(t)) : [];
}
