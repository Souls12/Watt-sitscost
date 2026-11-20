---
version: 1
slug: "app"
primary_target: "app"
related_targets: []
---

# App Watt'sitcost (Android)

Modo: Operate. Usuario del hogar, público amplio. Tarea central: entrar → reportar uso → salir en 3 toques. Restricciones: Material 3 (React Native Paper), 48 dp, texto en sp, modo oscuro diseñado, nunca regañar, racha bienvenida.

## Direction contract

THESIS: El periodo es un mes de almanaque de cocina: cada día es un cuadro con una luna que se llena según el presupuesto gastado. Rechaza el panel genérico de anillo de progreso más tarjetas.

OWN-WORLD: Encabezado amarillo almanaque #F6C12E, rojo título #C8312B solo para la acción principal y el día de hoy, tinta #1D1A16 sobre blanco, verde #3D7F4E para días dentro del presupuesto. Zilla Slab en títulos y cifras, Atkinson Hyperlegible en texto. Cuadros de día con borde fino, lunas como relleno circular, punto de racha.

STORY: El usuario abre, ve cuánto puede gastar hoy y cómo va el mes; toca Reportar uso, elige un aparato prellenado y confirma; la luna de hoy se llena, la racha sube y sale.

FIRST VIEWPORT: Encabezado amarillo con la racha y "Hoy puedes gastar X kWh" en Zilla Slab grande y su equivalente en pesos; cuadrícula del periodo L–D con hoy encerrado en rojo; resumen de hoy; botón flotante extendido rojo "Reportar uso" abajo a la derecha; barra de navegación Mes, Semanas, Aparatos, Factura.

FORM: Almanaque de la cocina, candidato 1 de la lista propia (IMPECCABLE’S PICK). seed:9dab1528302b80a5

Movimiento distintivo: la luna de hoy se llena en ≈400 ms al reportar; al cerrar el periodo el mes se arranca como hoja de almanaque.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
