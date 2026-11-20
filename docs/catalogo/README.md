# Catálogo inicial de electrodomésticos de Watt'sitcost

Datos de partida para que la app calcule el consumo con `kWh = potencia (W) × horas / 1000`. Investigación hecha en noviembre de 2026; revisión 2 con las decisiones del usuario (ver "Cambios de la revisión 2").

| Archivo | Contenido |
|---|---|
| `catalogo-modelos.csv` | 105 modelos: 7 tipos × 3 marcas × 5 modelos |
| `catalogo-genericos.csv` | 42 fichas genéricas sin marca (**pendiente**: el usuario exige fuentes colombianas; no se tocó en la revisión 2) |
| `marcas-mas-compradas.md` | Por qué se eligió cada marca y con qué evidencia |

Los CSV usan UTF-8 y separador coma. Los decimales del kWh/mes van con coma, tal como aparecen en la etiqueta, y esos valores van entre comillas.

## Reglas

1. **Nunca se calcula ni se estima una potencia.** Si un modelo no tiene potencia publicada, se reemplaza por otro modelo vigente de la misma marca y tipo que sí la tenga. Si la marca no tiene 5 modelos con dato, se dice aquí y se propone otra marca con evidencia de mercado.
2. **Regla pesimista (se prefiere sobrestimar el consumo):**
   - Si la fuente da un rango de potencia (por ejemplo, "730-995 W"), se usa el valor mayor.
   - Si la fuente solo publica la potencia o el consumo máximo (por ejemplo, el "consumo de energía (máx.)" de los televisores Samsung), se usa ese máximo, y la fila cuenta como "con dato".
3. **Columna `criterio_potencia`** (va justo después de `potencia_w`):

   | Valor | Significado |
   |---|---|
   | `nominal` | Potencia nominal única publicada (placa, ficha o "Potencia nominal de la operación") |
   | `maximo_rango` | La fuente da un rango o varias potencias; se tomó el mayor |
   | `maximo_publicado` | La fuente solo publica el consumo o la potencia máxima |

   La columna queda vacía solo cuando `potencia_w` está vacía.
4. **Nevera, lavadora y aire acondicionado.** Se guardan por separado la potencia (`potencia_w`) y el consumo de la etiqueta RETIQ (`consumo_kwh_mes_etiqueta`). La app debe preferir el kWh/mes de la etiqueta. En neveras y aires, la potencia sola sobrestima mucho el consumo mensual, porque el compresor cicla. Bases de las etiquetas: lavadoras 14 ciclos/mes; aires 132 h/mes.

## Metodología

1. **Marcas.** Se eligieron con la evidencia de mercado disponible (ver `marcas-mas-compradas.md`).
2. **Modelos.** Se tomaron modelos vigentes en el sitio colombiano del fabricante o en grandes superficies en 2026.
3. **Prioridad de fuentes.** La columna `notas` empieza con la prioridad de la fuente del dato principal de cada fila. En neveras, lavadoras y aires, el dato principal es el kWh/mes de la etiqueta; cuando la potencia viene de otra fuente, la nota lo dice.
   - **[P1]**: etiqueta RETIQ que el fabricante publica para Colombia. Haceb y Samsung la publican en PDF; se extrajo y se leyó su texto. Whirlpool la publica como imagen, y cada imagen se leyó.
   - **[P2]**: ficha técnica o manual en el sitio colombiano del fabricante. Incluye imusa.com.co (Groupe SEB: Samurai y T-fal), whirlpool.com.co y lorenzetti.com.co.
   - **[P3 fuente comercial]**: ficha en Falabella Colombia. Se leyó solo el bloque `specifications` del propio producto.
4. **No existe una base pública consultable de productos con etiqueta RETIQ** (Res. 41012 de 2015 y modificaciones, la más reciente la Res. 40285 de 2026). Por eso la P1 se cumple con la etiqueta que publica cada fabricante.
5. **Celdas vacías.** Una celda vacía es una de dos cosas:
   - **No aplica:** televisores, ventiladores, duchas y planchas no tienen etiqueta RETIQ, así que no llevan kWh/mes ni clase; las planchas no tienen capacidad.
   - **Pendiente:** el dato aplica, pero no se encontró publicado. La nota de la fila lo marca como "PENDIENTE DE SUSTITUCIÓN DE MARCA".

## Cambios de la revisión 2

**Se reemplazaron 15 modelos y se cambió la variante de otros 5 (20 filas en total). Además, se completó la potencia de 4 modelos que se mantuvieron.**

| Tipo / marca | Antes | Ahora | Motivo |
|---|---|---|---|
| Nevera Haceb | H6161FT25, HAV7164NT44 | H6161FT22 (300 W), HAV7164NT40 (150 W) | Sin potencia publicada |
| Nevera Haceb | H6164NT24A, H6164NT31A sin potencia | Se mantienen, con 150 W de Falabella | Se encontró la potencia (P3) |
| Nevera Mabe | RMP389GCC, MSL565QMLSP0 | RMA247FXCC (150 W), MSL630IOLBS0 (220 W) | Sin potencia publicada |
| Nevera Samsung | RT22FARADS8, RT31DG5220B1, RT38DG6220B1, RS57DG4000B4 | RT38DG6770B1CO (150 W), RT42DG6220B1CO (180 W), RB43DG6005S9CO (220 W), RS57DG4100B4CO (300 W) | Sin potencia publicada |
| Nevera Samsung | RB45DG6300B1CO sin potencia | Se mantiene, con 220 W de Falabella | Se encontró la potencia (P3) |
| Lavadora Samsung | WT75R2500HB, WA23C3554GV | WA80F17S8BCO, WA80F19S8BCO (1.200 W cada una) | Sin potencia publicada |
| Lavadora Samsung | WA70F13E4CCO, WA70F15E4CCO, WF90F26ADSCO sin potencia | Se mantienen, con 500, 500 y 1.200 W de Falabella | Se encontró la potencia (P3) |
| **Lavadora LG → Whirlpool** | WT15OBTX6, WT19OVTB, WT23EGTX6, WO16EGNTS6P, WM25BFXS | WWI12ASHLS, 8MWTW1643MJQ, WWH18ATALN, WW20NBAHLA, 8MWTW2241WJB | **Cambio de marca:** ningún modelo LG tiene etiqueta ni kWh/mes publicado (LG no publica etiquetas: `energyLabelFlag=N`; Falabella solo da valores sin sentido). Whirlpool publica etiqueta RETIQ y potencia en su sitio colombiano, y tiene evidencia de mercado (ver `marcas-mas-compradas.md`) |
| Ducha Lorenzetti | 5 modelos en versión 220 V (6.800 W) | Los mismos 5 modelos en versión 110-127 V (5.500 W, `maximo_rango`) | Decisión del usuario: 120 V es lo común en Colombia |
| Televisor Samsung | — | `criterio_potencia = maximo_publicado` | Regla pesimista |
| Aire Haceb | Notas con potencia "calculada" (kWh ÷ 132 h) | Se eliminó ese cálculo | Regla 1: no calcular |

## Marcas que hay que sustituir: falta decisión del usuario

En tres casos no hubo modelos de la misma marca con el dato. Las filas siguen en el CSV con la celda vacía y la nota "PENDIENTE DE SUSTITUCIÓN DE MARCA". **No encontré ninguna marca alternativa que cumpla del todo.**

1. **Televisor LG (5 filas sin potencia).** LG Colombia solo publica el consumo en espera (<0,5 W) y ningún modelo LG vendido en Colombia publica potencia máxima ni en modo encendido (sitio LG, Falabella y Alkosto revisados). LG es la marca número 2 del mercado (Euromonitor 2022: 24,8 %), así que sustituirla cambia mucho el catálogo.
2. **Televisor TCL (4 de 5 filas sin potencia; el 55A300W sí tiene 150 W de Falabella).** La tabla de especificaciones de tcl.com/co (leída por su API) no incluye potencia ni consumo para ningún modelo (C6K, P7K, S5K, C7L, X11L…), y Falabella solo la publica para el 55A300W.
   - Candidatas para TV (LG y TCL): Kalley (marca propia de Alkosto, sin dato de participación) tiene **un solo** modelo con potencia publicada (50GM400, 160 W, Falabella); Challenger y Hisense no publican potencia. **Ninguna tiene 5 modelos con dato.** Opciones para que decida el usuario: (a) completar con Samsung y una segunda marca que se acepte con menos de 5 modelos; (b) pedir la potencia a LG/TCL o medirla; (c) aceptar valores de manuales de usuario cuando se consigan (LG gscs.lge.com no fue accesible).
3. **Aire acondicionado Haceb (5 filas sin potencia) y LG (5 filas sin kWh/mes).** Haceb no publica potencia eléctrica (ni ficha ni manual), y Falabella da valores contradictorios (HAO169BT1 aparece como 12.000 BTU con 1.064 W; HAI1612BT1 con 2.100 W). LG no publica etiqueta RETIQ ni kWh/mes.
   - Candidatas evaluadas:
     - **Mabe:** mejor evidencia (GfK 2023: 21,6 %). Publica kWh/mes en Falabella para 4-5 modelos (por ejemplo, MMT12CABWCC32EC1, 162,7 kWh/mes; MMI09CDBWCC32DC1, 110,3; MMI12CDMCC32AC1, 122,8), pero **ninguno con potencia válida**.
     - **Midea:** dice ser número 1 (dato propio, ~20 %). Tiene kWh/mes en Falabella, pero no potencia, y su sitio colombiano no muestra especificaciones. Sus valores de kWh/mes coinciden exactamente con los de los aires inverter de Haceb (139,2 y 141,8), lo que sugiere que Midea los fabrica.
     - **Challenger:** 1 modelo con ambos datos (9K ON/OFF 110: 132 kWh/mes y 1.300 W).
   - **Propuesta:** Mabe, si el usuario acepta filas de aire con kWh/mes y sin potencia (para aires, el dato que importa en el cálculo es el kWh/mes de la etiqueta). Si no, no hay una tercera marca de aires que cumpla la regla.

## Conteo (revisión 2)

**Filas por prioridad de la fuente principal:** P1 = 34, P2 = 39, P3 = 32.

**`criterio_potencia`:** `nominal` = 79, `maximo_rango` = 7 (Whirlpool 8MWTW1643MJQ y 8MWTW2241WJB; las 5 Lorenzetti), `maximo_publicado` = 5 (televisores Samsung), vacío = 14.

**Celdas vacías en `catalogo-modelos.csv`:** 239 en total.

| Columna | Vacías | Desglose |
|---|---|---|
| `potencia_w` / `criterio_potencia` | 14 / 14 | **Pendientes:** TV LG (5), TV TCL (4), aires Haceb (5) |
| `consumo_kwh_mes_etiqueta` / `fuente_consumo_url` | 65 / 65 | 60 no aplica; **5 pendientes:** aires LG |
| `clase_energetica_retiq` | 61 | 60 no aplica; **1:** Mabe RMP470ZCU (la ficha dice "A+++", que no es una clase RETIQ) |
| `fuente_potencia_url` | 5 | Aires Haceb. En los televisores LG y TCL sin potencia se dejó la URL de la ficha revisada |
| `capacidad_o_tamano` | 15 | Planchas (no aplica) |

## Dudas y datos para revisar antes de producción

### Catálogo de modelos

1. **Potencias de neveras tomadas de Falabella (P3).** Falabella repite "300 W" en varias neveras Haceb de tamaños muy distintos (posible valor genérico; Haceb H6161FT22 usa ese dato), y en otras marcas publica valores absurdos (por ejemplo, 3.500 W en dos nevecones Samsung, que se descartaron). Para el cálculo debe usarse el kWh/mes de la etiqueta (P1), que sí es confiable.
2. **Samsung WA80F17S8BCO y WA80F19S8BCO:** el PDF de su etiqueta trae los valores sin rótulos ("12 80 … 17 kg"). Se leyó 12 kWh/mes por el mismo orden de campos que las etiquetas WA70F, que sí tienen texto completo. Verificar con la etiqueta física.
3. **Potencias de lavadoras Samsung de Falabella (P3):** 500 W (WA70F) y 1.200 W (WA80F y WF90F). Se descartó el WA70H23SPBCO porque Falabella le asigna 2.200 W, un valor improbable para una lavadora sin calentador.
4. **Lavadoras Haceb ZOÜ/IVY:** la tabla del manual agrupa modelos (620 W y 700 W) y se asignó por la posición de las columnas. Verificar con la placa.
5. **Whirlpool:** la ficha da "Watts 730-995" para 8MWTW1643MJQ y 8MWTW2241WJB; se usó 995 W (regla pesimista).
6. **Duchas Lorenzetti:** la tabla eléctrica de lorenzetti.com.co es común a toda la línea y para 127 V lista 4.800 y 5.500 W sin decir qué modelo corresponde; se usó 5.500 W (regla pesimista). Falabella publica "550 W", un valor erróneo.
7. **Televisores Samsung:** valor máximo publicado; el consumo real en uso es menor.
8. **TCL 55A300W:** los 150 W de Falabella no indican si son típicos o máximos (se marcó como `nominal`).
9. **Aires Haceb:**
   - HAI1612BT1: la etiqueta RETIQ publicada tiene errores de digitación ("1401,68 kWh/mes", "3511875 vatios"); se usó 141,8 kWh/mes de haceb.com (P2).
   - HAO2612BT1: la etiqueta dice 158,80 kWh/mes y la web dice 149,16; se usó la etiqueta.
10. **Aire LG VV242C5:** la ficha indica 22.000 BTU/h de capacidad nominal aunque el modelo se vende como de 24.000 BTU/h.
11. **Mabe (P3):** las capacidades de Falabella son a veces inconsistentes (RMA247FXCC: "247 L brutos", "230 L" en el título y "172 L útiles").
12. **Fame Elegance 110V:** el voltaje se toma del título de Falabella.
13. **Oster GCSTPX9000B:** la ficha dice "1.700" sin unidad; se interpretó como 1.700 W.
14. **Home Elements "MaxiFlow pared 18"":** Falabella no publica el código de referencia.
15. **T-fal Ultragliss Plus:** los 1.800 W vienen del nombre oficial del producto en imusa.com.co y coinciden con Falabella.
16. **Boccherini y Fame incluyen una versión de 220 V cada una** (Boccherini 1601220, Fame Super Ducha 4T 220V). La regla de 120 V se aplicó solo a Lorenzetti, como se pidió. Si debe aplicarse a todas las duchas, hay que cambiar esas 2 filas.

### Catálogo genérico (pendiente)

17. No se modificó en la revisión 2. Sus fuentes actuales son MINEM Perú y US DOE/EERE, que el usuario no acepta (exige fuentes colombianas); se resolverá aparte. Dudas abiertas: router, consola y congelador sin potencia; sanduchera tomada del valor de "waflera"; calentador de agua con rango muy amplio; monitor con dato antiguo; horas de uso casi todas vacías.

### Marcas

18. Ver "Marcas que hay que sustituir": televisor (LG, TCL) y aire acondicionado (Haceb, LG).
19. Siguen sin dato de participación público y reciente **duchas** y **planchas**; en ellas el criterio fue el surtido en grandes superficies.

## Modelos sin potencia publicada: retirados

Por decisión del usuario, los modelos sin potencia publicada se retiraron del catálogo en lugar de estimarlos: 5 televisores LG, 4 televisores TCL y 5 aires acondicionados Haceb. Los aires LG se conservan porque sí publican potencia; su kWh/mes de etiqueta queda vacío, ya que el cálculo de la app solo usa la potencia. Si aparece el dato de alguno de los retirados, puede volver a agregarse.

## Fichas genéricas: solo fuente oficial colombiana

Decisión del usuario: las fichas genéricas usan únicamente fuentes oficiales colombianas. La única con potencias medidas es el estudio UPME-Universidad Nacional (2006), guardado en `fuentes/`. Como es antiguo, solo se conservan los aparatos cuya medición sigue vigente: ducha eléctrica, ventilador y licuadora, con valor pesimista. Se descartaron los televisores (de tubo), los bombillos incandescentes y la plancha (el estudio solo dice "más de 1.000 W").

Todo aparato que no esté en el catálogo lo registra el usuario con la potencia de su etiqueta (con la guía visual) y puede proponerlo al catálogo general para que el administrador lo apruebe.

La versión anterior, con fuentes extranjeras, se conserva como referencia en `fuentes/catalogo-genericos-descartado-fuentes-extranjeras.csv`. La cartilla de EPM (2025) no trae tabla de potencias.
