// Transición entre pestañas: la nueva se desliza desde el lado de su posición en la barra (sentido de lectura).
// Se aplica en screenOptions de las pestañas.
export function useTransicionPestanas() {
  return { animation: 'shift' } as const;
}
