// Aparatos comunes de la configuración inicial: un toque agrega el aparato con potencia, cantidad y uso típicos.
// Los valores de uso son estimaciones razonables y se pueden editar después en Aparatos.
export type TipoComun = {
  tipo: string; // nombre en tipos_aparato / aparatos_referencia
  nombre: string; // como lo dice la gente
  icono: string; // Material Community Icons
  horas: number; // uso típico al día
  constante?: boolean; // se registra solo cada día
};

export const TIPOS_COMUNES: TipoComun[] = [
  // shortcut: la nevera enciende el compresor ~1/3 del día; 8 h en vez de 24 h, afinar con datos reales.
  { tipo: 'Nevera/Nevecón', nombre: 'Nevera', icono: 'fridge', horas: 8, constante: true },
  { tipo: 'Televisor', nombre: 'Televisor', icono: 'television', horas: 4 },
  { tipo: 'Ventilador', nombre: 'Ventilador', icono: 'fan', horas: 6 },
  { tipo: 'Licuadora', nombre: 'Licuadora', icono: 'blender', horas: 0.25 },
  { tipo: 'Ducha eléctrica', nombre: 'Ducha eléctrica', icono: 'shower-head', horas: 0.25 },
  { tipo: 'Lavadora', nombre: 'Lavadora', icono: 'washing-machine', horas: 1 },
  { tipo: 'Plancha', nombre: 'Plancha', icono: 'iron', horas: 0.5 },
  { tipo: 'Aire acondicionado', nombre: 'Aire acondicionado', icono: 'air-conditioner', horas: 6 },
];

type Ref = { id: number; tipo: string; potencia_w: number };

/** La ficha de potencia mediana del tipo (ni la más baja ni la más alta); null si no hay fichas. */
export function referenciaTipica<T extends Ref>(refs: T[], tipo: string): T | null {
  const l = refs.filter((r) => r.tipo === tipo).sort((a, b) => a.potencia_w - b.potencia_w || a.id - b.id);
  return l.length ? l[Math.floor((l.length - 1) / 2)] : null;
}
