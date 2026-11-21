# Lenguaje de movimiento

Principio: el movimiento es el almanaque cobrando vida. Cada animación comunica un hecho (llené el día, subió la racha, cerró el periodo) y nunca decora ni regaña. Todo corre en el hilo de UI (Reanimated 4 y Skia).

## Referencias

Nota: las referencias se citan de conocimiento previo, con enlaces a las páginas canónicas; no se verificó en línea que sigan vigentes ni se midió nada de ellas. Conviene revisarlas al pulir.

| Referencia | Qué se toma |
|---|---|
| Material 3, motion (https://m3.material.io/styles/motion/overview) | Curvas "emphasized decelerate" para lo que llega y "accelerate" para lo que se va; duraciones cortas (150-300 ms) para cambios pequeños; criterio de que la transición muestre jerarquía y relación espacial. Es la base porque la app usa Paper/MD3. |
| Apple HIG, motion (https://developer.apple.com/design/human-interface-guidelines/motion) | Movimiento con propósito, nunca obligatorio para entender; alternativa sin movimiento cuando el usuario reduce animaciones. |
| Duolingo, racha | La racha celebra con un salto pequeño y elástico, no con confeti; se toma el resorte con rebote leve y se descarta cualquier animación de pérdida (la app nunca regaña). |
| Calendarios de pared de hojas arrancables (referencia física) | La hoja se sujeta por arriba, gira y cae con gravedad, sale hacia el lado del que se arranca. Inspira el cierre del periodo. |
| Contadores tipo "odómetro" (Robinhood, relojes de aeropuerto) | La cifra nueva entra desde abajo empujando a la anterior hacia arriba: el sentido indica que el valor crece. |
| Emil Kowalski, "Animations on the web" (https://animations.dev) | Salidas rápidas, entradas con desaceleración, no animar acciones que se repiten decenas de veces al día más de lo necesario. |
| Documentación de Reanimated y Skia (https://docs.swmansion.com/react-native-reanimated, https://shopify.github.io/react-native-skia) | Valores compartidos y animaciones de layout en el hilo de UI; Skia lee valores compartidos como props sin pasar por JS. |

## Duraciones

| Nombre | ms | Uso |
|---|---|---|
| corta | 150 | Fundidos |
| media | 280 | Cifra que cambia, transición de pestañas |
| luna | 400 | Luna que se llena (momento distintivo de la app) |
| hoja | 520 | Hoja arrancada, la más larga porque cierra un periodo |

Nada pasa de 600 ms. Las acciones repetidas (cifra) usan la duración media.

## Curvas y resortes

- `sale` cubic-bezier(0.2, 0, 0, 1): lo que llega y se asienta (luna, cifra entrante).
- `entra` cubic-bezier(0.3, 0, 0.8, 0.15): lo que se va, acelerando (cifra saliente, hoja).
- `transforma` cubic-bezier(0.4, 0, 0.2, 1): cambios sin entrada ni salida (fundidos).
- Resorte de racha: damping 12, stiffness 180, mass 0.8. Un rebote, sin oscilación visible después. Es el único resorte; el resto es con curva.

## Coreografía y dirección

- Al reportar uso (secuencia): la luna de hoy se llena (400 ms) y, sin esperar, la cifra de "puedes gastar" cambia; si el día cuenta para la racha, el punto de la racha salta unos 100 ms después. Una cosa a la vez en foco, no todas igual de fuertes.
- Luna: el relleno sube desde abajo, como llenar un vaso.
- Cifra: la anterior sale hacia arriba, la nueva entra desde abajo (el número sube).
- Racha: el punto salta hacia arriba (14 dp) y cae con resorte; el número usa Cifra.
- Pestañas: la nueva entra desde el lado donde está en la barra (Mes, Semanas, Aparatos, Factura de izquierda a derecha), sentido de lectura.
- Hoja de almanaque: se arranca hacia la izquierda con un giro de -18 grados, cae y se desvanece en el último 30 %. La hoja nueva ya está debajo.

## Quitar animaciones

Por decisión del usuario (2026-11-21), las animaciones se reproducen siempre: la app no atiende el ajuste del sistema "quitar animaciones". No hay ramas de movimiento reducido en `src/motion/*` ni en pantallas, y no se deben añadir. Para que Reanimated tampoco las apague por su cuenta (su valor por omisión sigue al sistema), la raíz monta `<ReducedMotionConfig mode={ReduceMotion.Never} />`.

## Piezas (src/motion)

`Luna`, `Cifra`, `Racha`, `HojaArrancada`, `useTransicionPestanas` y los tokens `dur`, `curva`, `resorte`. Pantalla de muestra solo de desarrollo: ruta `/movimiento`.

## Sin verificar

No se ha corrido en dispositivo ni medido fps en un Android de gama media; todo está pensado para evitar el hilo de JS (valores compartidos, layout animations, props de Skia animadas).
