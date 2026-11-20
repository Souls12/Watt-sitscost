// Fechas como días locales (Bogotá, sin hora): YYYY-MM-DD <-> Date a mediodía local, sin pasar por UTC.
const dos = (n: number) => String(n).padStart(2, '0');
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const aIso = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
export const hoyIso = () => aIso(new Date());
export const deIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};
/** "20 de noviembre de 2026" (con año solo si se pide). */
export const fechaLarga = (iso: string, conAnio = true) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[m - 1]}${conAnio ? ` de ${y}` : ''}`;
};
