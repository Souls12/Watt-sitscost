// Un icono (Material Community Icons) por cada tipo de tipos_aparato; 'Otro' es el respaldo de cualquier tipo nuevo.
export const ICONOS_TIPO: Record<string, string> = {
  'Aire acondicionado': 'air-conditioner',
  'Ducha eléctrica': 'shower-head',
  Lavadora: 'washing-machine',
  Licuadora: 'blender',
  'Nevera/Nevecón': 'fridge',
  Plancha: 'iron',
  Televisor: 'television',
  Ventilador: 'fan',
  Otro: 'power-plug',
};

export const iconoTipo = (tipo: string) => ICONOS_TIPO[tipo] ?? ICONOS_TIPO.Otro;
