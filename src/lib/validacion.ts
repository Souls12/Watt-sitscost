export const correoValido = (correo: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());

// Letra ASCII: coincide con la regla "letters and digits" de Supabase Auth.
export const contrasenaValida = (clave: string) =>
  clave.length >= 8 && /[A-Za-z]/.test(clave) && /\d/.test(clave);
