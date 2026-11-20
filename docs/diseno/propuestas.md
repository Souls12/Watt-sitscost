# Propuestas de diseño de Watt'sitcost

Tres propuestas para elegir, más la alternativa estándar. Los bocetos de la primera pantalla de cada una están en `.impeccable/mocks/decision/` y en la página de decisión.

Las tres comparten la estructura base, porque la estructura sale de las leyes de UX y no del estilo:

## Base común (va en cualquier propuesta)

| Ley de UX | Qué significa | Cómo se aplica |
|---|---|---|
| **Hick** (más opciones = más tiempo para decidir) | Pocas opciones por pantalla | Barra inferior con solo 4 destinos: Hoy, Semanas, Aparatos, Factura. Al reportar se muestran primero los 4 aparatos más usados, no el catálogo completo. |
| **Fitts** (lo grande y cercano se toca más rápido) | El botón principal debe ser grande y estar al alcance del pulgar | "Anotar / Reportar uso" mide 60 dp de alto y está en la mitad inferior. Todos los toques miden al menos 48 dp. |
| **Jakob** (la gente espera lo que ya conoce de otras apps) | Usar patrones de Android | Barra de navegación inferior de Material 3, gesto Atrás del sistema, hojas inferiores, snackbars y diálogos estándar. |
| **Miller** (la memoria corta guarda ~7 cosas) | Agrupar la información | El panel muestra 3 cifras clave: te queda hoy, llevas del periodo, días restantes. El detalle vive un nivel más abajo. |
| **Tesler** (la complejidad no desaparece, alguien la carga) | La app carga lo difícil, no el usuario | La app hace los cálculos (kWh, pesos, presupuesto) en Postgres; los aparatos de uso constante se anotan solos; el uso típico prellena el formulario. |
| **Doherty** (respuesta en menos de 400 ms mantiene el ritmo) | Nunca esperar sin respuesta | El registro de uso se muestra al instante (actualización optimista) y se sincroniza detrás. Se usan esqueletos de carga, no pantallas en blanco. |
| **Pico-final** (se recuerda el mejor momento y el final) | Cuidar el final de cada tarea | Al anotar: confirmación animada y la racha que sube. Al cerrar el periodo: resumen amable con lo que sí lograste, nunca un rojo de "fallaste". |
| **Von Restorff** (lo distinto se recuerda) | Una sola cosa destacada por pantalla | Solo el botón principal lleva el color de acento fuerte. |
| **Gradiente de meta** (la gente se esfuerza más cerca de la meta) | Mostrar el avance | Barra o calendario del periodo, y una racha de días seguidos reportando (la pediste explícitamente). |

**Flujo "entrar → reportar → salir" (3 toques):**
1. Abrir la app: cae directo en **Hoy**, sin pantallas intermedias (la sesión es persistente).
2. Tocar **Anotar uso**: se abre una hoja inferior con los aparatos frecuentes y el tiempo ya prellenado con su uso típico.
3. Tocar el aparato, ajustar el tiempo si hace falta y confirmar. La hoja se cierra, el total se actualiza y la racha sube.

**Accesibilidad:** texto en `sp` que respeta el tamaño de letra del sistema, contraste mínimo de 4,5:1, modo oscuro diseñado (no invertido) y animaciones que se apagan si el sistema pide "quitar animaciones".

**Gamificación, sin regañar:** racha de días reportando, reconocimientos por constancia ("4 semanas anotando"). Pasarse de la meta se muestra en el color neutro de la tinta con una sugerencia, nunca en rojo de alarma.

---

## Propuesta 1: El cuaderno de cuentas

> Reportar es anotar: cada uso se escribe en la página de hoy y el total se subraya.

Viene del cuaderno cuadriculado donde la tienda de barrio anota lo de cada día. Todo el mundo en Colombia lo reconoce.

- **Tipografía:** *Atkinson Hyperlegible* para todo el texto (diseñada para baja visión, ideal para un público amplio) y *Kalam*, letra a mano, solo en las cifras grandes (totales y "te queda hoy").
- **Paleta clara:** verde tapa `#0E7C5A` (barra superior), azul tinta de esfero `#1F3FA8` (acento y botón principal), hoja `#FBFCFE`, cuadrícula `#C9D8EE`, línea de margen roja `#D9473A` (solo decorativa, nunca para regañar).
- **Paleta oscura:** tapa `#0B3D2E`, hoja `#10161F`, cuadrícula `#1F2A3A`, tinta `#9DB6FF`.
- **Movimiento distintivo:** al anotar, la línea nueva se "escribe" de izquierda a derecha como un trazo de esfero (≈ 350 ms) y el total del día se subraya dos veces.
- **Microinteracciones:** el número de la racha pasa la página; los aparatos archivados se tachan con una línea, no desaparecen.
- **Estados de carga:** las líneas de la hoja aparecen como renglones vacíos de la cuadrícula que se llenan.
- **Pantallas:**
  - **Hoy:** la página del día.
  - **Semanas:** cada semana es una página con su total, siempre a la misma escala.
  - **Aparatos:** índice del cuaderno con buscador.
  - **Factura:** se registra en una "hoja de factura" con la guía visual al lado.
  - **Onboarding:** "abrir el cuaderno": tres páginas (cuenta, ubicación, tarifa).
- **Mejoras tomadas de las otras propuestas:**
  - control de meta con recálculo en vivo
  - nada se borra, se tacha
  - eliminar queda aislado
  - un color fijo por tipo de aparato
  - comparación siempre a la misma escala
- **Riesgo:** si la cuadrícula se usa como adorno de tabla, parece papelería. La letra a mano solo va en cifras grandes.

## Propuesta 2: El almanaque de la cocina ⭐ mi favorita

> El periodo es un mes de almanaque: cada día es un cuadro que se llena según lo que gastaste.

Viene del almanaque colgado en la cocina, con su mes en cuadros y la fase de la luna de cada día.

- **Tipografía:** *Zilla Slab* (con serifa cuadrada, como los almanaques impresos) para títulos y cifras, y *Atkinson Hyperlegible* para el texto.
- **Paleta clara:** amarillo almanaque `#F6C12E` (encabezado), rojo título `#C8312B` (botón principal y día de hoy), tinta `#1D1A16`, blanco `#FFFFFF`, verde `#3D7F4E` (días dentro del presupuesto).
- **Paleta oscura:** fondo `#16140F`, encabezado `#3A2F0B` con texto amarillo, verde `#7CC48D`, rojo `#F07A6E`.
- **Movimiento distintivo:** cada día es una "luna" que se llena según el porcentaje del presupuesto gastado. Al reportar, la luna de hoy se llena con una animación de ≈ 400 ms. Un punto marca los días reportados (la racha).
- **Microinteracciones:** el cuadro de hoy late suavemente una vez al abrir. Al cerrar el periodo, el mes se "arranca" como una hoja de almanaque y aparece el siguiente.
- **Estados de carga:** las lunas aparecen vacías y punteadas, y se llenan en cascada.
- **Pantallas:**
  - **Mes:** el periodo completo en un vistazo.
  - **Semanas:** filas del almanaque con barras.
  - **Aparatos:** lista con buscador.
  - **Factura:** al registrarla, se cierra el mes y se compara.
  - **Onboarding:** "colgar tu almanaque".
- **Riesgo:** es la más familiar; un calendario de calor recuerda a otras apps de hábitos. A cambio, es la que mejor explica el periodo, el presupuesto diario y la racha en una sola imagen.

## Propuesta 3: Un aparato por pantalla

> Reportar es deslizar: cada aparato ocupa toda la pantalla y se registra con los botones de la derecha.

Viene de los videos verticales que casi todo el mundo desliza a diario.

- **Tipografía:** *Figtree*, redonda, moderna y muy legible.
- **Paleta:** cada tipo de aparato tiene su campo de color (nevera azul `#2B59C3`, ducha naranja `#E07A1F`, lavadora verde `#2E8B57`…), con íconos blancos. La navegación va en casi negro `#14161A`. Funciona igual en claro y oscuro, porque el color es el aparato.
- **Movimiento distintivo:** deslizar hacia arriba salta de aparato en aparato con un salto firme. Los botones del riel (+15 min, +1 h, típico, listo) se llenan y cuentan hacia arriba al tocarlos.
- **Microinteracciones:** "listo" lanza el aparato hacia arriba y trae el siguiente. Al terminar la lista aparece el resumen del día.
- **Estados de carga:** el siguiente aparato ya está precargado, así que no hay espera visible.
- **Pantallas:**
  - **Reportar:** el feed de aparatos.
  - **Mi meta, Semanas y Factura:** pantallas Material normales.
  - **Onboarding:** elegir tus aparatos deslizando.
- **Riesgo:** reportar es rapidísimo, pero comparar semanas y facturas necesita pantallas normales, así que la app termina con dos lenguajes visuales.

## Alternativa estándar: Material 3

Una tarjeta de meta con anillo de progreso, la lista de aparatos y un botón flotante "Registrar uso", en verde energía con color dinámico. Es correcta y se ve bien, pero es indistinguible de cualquier otra app del género, justo lo que pediste evitar ("que se vea genérica").

---

# Segunda mano (más atrevida)

Bocetos en `.impeccable/mocks/mano-2/`. La base común de arriba (leyes de UX, flujo de 3 toques, racha, nunca regañar) aplica igual.

## Propuesta 4: Señalética amarilla

> La app te dice una sola cosa a la vez, en grande: cuánto te queda hoy y cuál es el siguiente paso.

Viene de los letreros amarillos de aeropuertos, TransMilenio y el Metro.

- **Tipografía:** *Fira Sans*, humanista y de letrero; cifra del día monumental (≈ 92 sp).
- **Paleta clara:** amarillo señal `#FFCC00` (solo para el estado del día), negro `#111111`, blanco, gris andén `#ECEBE6`, verde `#2F6F4F`.
- **Paleta oscura:** fondo `#0E0E0D`, el amarillo se mantiene en la franja, y los pictogramas pasan a amarillo sobre negro.
- **Movimiento distintivo:** al anotar, la cifra cambia con un efecto de tablero de aeropuerto (split-flap, ≈ 300 ms) y la franja negra muestra el siguiente paso.
- **Microinteracciones:** la franja "Siguiente" sugiere el aparato que más reportas a esa hora.
- **Estados de carga:** las franjas aparecen vacías y la cifra muestra "– –" hasta llegar.
- **Mejoras tomadas de las otras:** módulos compactos en Semanas y Factura, el largo de cada barra es igual a sus horas, y los estados se distinguen por forma, no solo por color.
- **Riesgo:** si el amarillo se usa fuera del estado del día, pierde su fuerza.

## Propuesta 5: Tus aparatos tienen personalidad

> Cada aparato es un personaje redondo con su frase, ordenados por cuánto consumen hoy.

- **Tipografía:** *Fredoka* (redonda) para títulos y cifras, y *Nunito* para el texto.
- **Paleta:** fondos pastel por aparato (rosa `#FFE3EC`, celeste `#DDF1FF`, menta `#E6F7DF`), tinta `#2A2440` y coral `#FF6B4A` para la racha. En modo oscuro, los pastel bajan a tonos profundos y los personajes conservan su color.
- **Movimiento distintivo:** el personaje rebota al anotarle uso y sube o baja en el ranking con una animación.
- **Gamificación:** es la que más la aprovecha: racha, ranking del día y frases de cada aparato.
- **Riesgo:** si los personajes ganan protagonismo, se ve infantil para adultos mayores.

## Propuesta 6: Energía en cuadritos

> Tu presupuesto de hoy es una cuadrícula: cada cuadrito vale 0,1 kWh y se pinta cuando lo usas.

- **Tipografía:** *Big Shoulders Display* para la cifra, y *Hanken Grotesk* para el texto.
- **Paleta:** blanco con cuadrícula azul visible `#BFD4F2`, naranja `#FF5A1F` (lo usado), tinta `#1A1A1A` y verde `#0F6E5C` (racha).
- **Movimiento distintivo:** al anotar, los cuadritos se pintan uno a uno, en cascada.
- **Ventaja:** el presupuesto se cuenta a simple vista, sin leer números.
- **Riesgo:** con más de 10 kWh al día hay demasiados cuadritos y toca agruparlos (1 cuadrito = 0,5 kWh).
