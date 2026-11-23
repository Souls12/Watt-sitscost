// Formato de unidades para todo el producto (es-CO: coma decimal, punto de miles).
// Funciones puras; sin Intl porque Hermes en Android 9 no garantiza datos de locale.

const miles = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Energía a partir de kWh: "5,8 kWh", o "40 Wh" por debajo de 0,1 kWh. */
export function formatEnergy(kwh: number): string {
  if (kwh < 0.1) return `${miles(kwh * 1000)} Wh`;
  return `${(Math.round(kwh * 10) / 10).toString().replace('.', ',')} kWh`;
}

/** Dinero aproximado, redondeado a la decena: "≈ $4.870". */
export function formatMoney(pesos: number): string {
  return `≈ $${miles(Math.round(pesos / 10) * 10)}`;
}

/** Tarifa por kWh exacta: "$1.050" o "$650,5". */
export function formatTarifa(valor: number): string {
  const [entero, dec] = valor.toFixed(2).replace(/\.?0+$/, '').split('.');
  return `$${miles(Number(entero))}${dec ? ',' + dec : ''}`;
}

/** Potencia en W: "1.500 W". */
export function formatPower(watts: number): string {
  return `${miles(watts)} W`;
}

/** Duración a partir de minutos: "1 h 30 min". */
export function formatDuration(totalMin: number): string {
  const m = Math.round(totalMin);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} min`;
  return r ? `${h} h ${r} min` : `${h} h`;
}
