# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Stack

React Native con Expo y TypeScript; React Native Paper (Material 3) y Victory Native para gráficas; Supabase como backend (Postgres, Auth, RLS). Ver `docs/adr/0001-supabase-como-backend-con-calculos-en-postgres.md`. Android 9 (API 28) o superior; iOS fuera de alcance.

## Users

**Usuario del hogar**: persona adulta en Colombia que paga la factura de energía de su casa. Sabe usar una app móvil, pero no sabe calcular kWh ni relacionar sus aparatos con lo que paga. Público amplio: desde jóvenes hasta adultos mayores, con distinta habilidad digital. Usa la app en ratos cortos: después de usar un aparato, al final del día o cuando llega la factura.

**Administrador**: persona del equipo que revisa propuestas (aparatos, tarifas, ciudades, empresas). Uso ocasional.

## Product Purpose

Que un hogar entienda cuánto le cuesta cada aparato, se ponga una meta de reducción sobre su última factura y la sostenga mes a mes. Éxito: el usuario registra su uso sin fricción, ve cada día cuánto le queda de su presupuesto y, al llegar la factura, entiende si cumplió y qué ajustar.

## Positioning

La meta sale de la factura real del usuario y se reparte en un presupuesto diario que se recalcula con cada registro; al cerrar el periodo, la app compara lo facturado con la meta y con lo que ella misma calculó. Las tarifas por kWh las comparten y revisan los propios usuarios de la misma ciudad, estrato y empresa.

## Operating Context

Ritual central: **entrar → reportar uso → salir**, varias veces por semana, en segundos. Ritual mensual: llega la factura en papel o PDF (Afinia en Córdoba, entre otras), el usuario la registra y empieza un nuevo ciclo. Vocabulario en `GLOSSARY.md` (Registro de uso, Periodo, Consumo calculado vs. facturado, Tarifa vigente, Propuesta…).

## Capabilities and Constraints

- Cuentas con sesión persistente por dispositivo; confirmar correo y recuperar contraseña.
- Catálogo con buscador: 91 modelos con marca y potencia publicada, y 3 fichas genéricas oficiales (UPME). Lo que falte lo registra el usuario desde la etiqueta de su aparato y lo puede proponer al catálogo.
- Aparatos con cantidad, uso típico y opción de uso constante (nevera, router).
- Registro de uso solo dentro del periodo abierto o extendido.
- Meta por porcentaje (advertencia sobre 40 %), presupuesto diario, excedente, periodo extendido, cambio de meta a mitad de periodo.
- Factura con guía visual, comparación al cierre, recomendación de −5 puntos.
- Reporte semanal (lunes a domingo) y tendencias por aparato.
- Tarifas compartidas versionadas con revisión del administrador; bandeja de avisos en la app (sin push por ahora).
- La app no mide electricidad ni se conecta con la empresa de energía. El costo en pesos es aproximado y no representa el total de la factura.
- Fechas en zona horaria America/Bogota.
- Unidades: consumo siempre en kWh y en pesos juntos. Cifra principal en kWh por defecto; el usuario puede elegir pesos en ajustes. Coma decimal y punto de miles; un decimal en kWh (Wh por debajo de 0,1 kWh); pesos con "≈", redondeados a la decena y sin decimales; potencia en W; tiempo en h y min.

## Brand Commitments

Nombre: **Watt'sitcost**. Idioma: español de Colombia.

- **Bienvenida la gamificación que sostiene el hábito**: rachas de días reportando y reconocimientos por constancia.
- **Debe evitar**: parecer app de banco (fría, corporativa, llena de cifras), regañar (rojos alarmantes, mensajes de culpa al pasarse de la meta) y verse genérica (plantilla Material sin personalidad).

## Evidence on Hand

ERS completa en `WATT_SITSCOST_actualizado.docx` (requisitos, 32 casos de uso, prototipos de baja fidelidad). Catálogo inicial en investigación en `docs/catalogo/`. No hay logo, testimonios ni usuarios reales; no inventarlos.

## Product Principles

1. **Reportar cuesta segundos.** Cada registro de uso debe poder hacerse en pocos toques desde que se abre la app.
2. **Kilovatios traducidos a pesos.** Todo consumo se muestra también en su costo aproximado, porque es lo que el usuario entiende.
3. **Nunca castigar.** Pasarse de la meta o corregirla se presenta como información y una sugerencia, no como un fracaso.
4. **El usuario decide.** Nada cambia sus números sin su aprobación: tarifas, fichas del catálogo o recomendaciones.
5. **Enseñar en el lugar.** La ayuda aparece donde se necesita el dato (guía visual), no en un manual aparte.

## Accessibility & Inclusion

Usuarios no técnicos de todas las edades: tamaños de texto que respeten la configuración del sistema, objetivos táctiles de 48 dp, contraste suficiente y modo oscuro. Teléfonos Android de gama media o baja: rendimiento y peso de la app importan.
