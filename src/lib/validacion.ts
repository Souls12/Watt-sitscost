export const correoValido = (correo: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());

// Letra ASCII: coincide con la regla "letters and digits" de Supabase Auth.
export const contrasenaValida = (clave: string) =>
  clave.length >= 8 && /[A-Za-z]/.test(clave) && /\d/.test(clave);

import { leerNumero as numero } from './numero';

export type EntradaAparato = {
  nombre: string;
  potencia: string;
  cantidad: string;
  usoHoras: string;
  usoConstante: boolean;
};

// Valida lo que escribe el usuario; la base de datos repite estas reglas con restricciones CHECK.
export function validarAparato(e: EntradaAparato) {
  const potencia_w = numero(e.potencia);
  const cantidad = numero(e.cantidad);
  const uso = e.usoHoras.trim() === '' ? null : numero(e.usoHoras);
  if (!e.nombre.trim()) return { ok: false as const, error: 'Escribe un nombre.' };
  if (!(potencia_w > 0)) return { ok: false as const, error: 'La potencia debe ser mayor que cero.' };
  if (!Number.isInteger(cantidad) || cantidad < 1) return { ok: false as const, error: 'La cantidad debe ser un número entero, mínimo 1.' };
  if (uso !== null && !(uso > 0 && uso <= 24)) return { ok: false as const, error: 'El uso típico va entre 0 y 24 horas al día.' };
  if (e.usoConstante && uso === null) return { ok: false as const, error: 'Para uso constante indica las horas al día (por ejemplo 24).' };
  return {
    ok: true as const,
    valor: { nombre: e.nombre.trim(), potencia_w, cantidad, uso_tipico_horas: uso, uso_constante: e.usoConstante },
  };
}
