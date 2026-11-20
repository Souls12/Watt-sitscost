export type Tema = 'sistema' | 'claro' | 'oscuro';

export const temaOscuro = (tema: Tema, sistema: string | null | undefined) =>
  tema === 'sistema' ? sistema === 'dark' : tema === 'oscuro';
