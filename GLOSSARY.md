# Watt'sitcost

App Android para que hogares en Colombia estimen el consumo eléctrico de sus electrodomésticos, lo vean en pesos y cumplan metas de reducción.

## Personas

**Usuario**:
Persona adulta responsable de pagar la factura de energía de su hogar.
_Avoid_: Cliente, cuenta

**Administrador**:
Usuario designado por el equipo que aprueba o rechaza propuestas de aparatos y tarifas compartidas. Se asigna a mano, nunca desde la app.
_Avoid_: Admin, moderador

## Consumo

**Consumo calculado**:
kWh que la app obtiene a partir de la potencia de los aparatos y el uso registrado.
_Avoid_: Consumo real, consumo estimado

**Consumo facturado**:
kWh que aparece en la factura y que el usuario ingresa tal cual.
_Avoid_: Consumo real, lectura

**Aparato de referencia**:
Ficha del catálogo general: un modelo concreto (tipo, marca, modelo y potencia, verificados en fuente oficial) o una ficha genérica (solo tipo y potencia típica) para aparatos sin datos por modelo. Cuando la fuente da un rango o solo un máximo, su potencia es el valor mayor (criterio pesimista: mejor sobrestimar el consumo que subestimarlo). Al usarla, el usuario copia sus datos a su propio aparato; si la ficha cambia después, recibe un aviso y decide si actualiza su copia.
_Avoid_: Plantilla, aparato del catálogo

**Aparato**:
Electrodoméstico del usuario, con potencia, cantidad de unidades iguales y uso típico opcional. Eliminarlo lo archiva: deja de aceptar registros de uso pero lo ya registrado sigue contando.
_Avoid_: Dispositivo, equipo

**Registro de uso**:
Anotación de que un aparato se usó cierta cantidad de horas en una fecha. Es la única fuente del consumo calculado. Solo se acepta dentro del periodo abierto o extendido (o hasta 30 días atrás si aún no hay periodo).
_Avoid_: Tiempo de uso fijo, horas/días de uso

**Uso típico**:
Horas que un aparato se usa normalmente; solo sirve para prellenar un registro de uso.

**Aparato de uso constante**:
Aparato (nevera, router) cuyo registro de uso diario la app crea sola con su uso típico, salvo que el usuario lo cambie ese día.
_Avoid_: Aparato automático

**Costo aproximado**:
Consumo en kWh multiplicado por la tarifa vigente en esa fecha. Nunca se guarda; siempre se calcula.
_Avoid_: Valor de la factura, costo real

## Tarifas

**Tarifa compartida**:
Valor por kWh que un usuario publica para su ciudad, estrato y empresa proveedora, y que otros pueden elegir tras la aprobación del administrador.
_Avoid_: Tarifa pública, precio comunitario

**Versión de tarifa**:
Un valor de una tarifa compartida con su fecha. Cada actualización crea una versión pendiente que no llega a nadie hasta ser aprobada.

**Tarifa vigente**:
La versión de tarifa (o tarifa propia) que el usuario usa hoy en sus cálculos. Solo cambia por decisión del usuario.
_Avoid_: Tarifa actual

**Aviso**:
Mensaje en la bandeja de la app sobre algo que requiere atención del usuario, como una nueva versión de tarifa o el resultado de una propuesta.
_Avoid_: Notificación push, alerta

## Ayuda

**Guía visual**:
Mini tutorial dentro de un formulario que muestra dónde encontrar un dato en el mundo real, como el consumo en la factura o la potencia en la etiqueta del aparato. Usa ilustraciones simplificadas que muestran solo el dato que se busca, no copias completas del documento real.
_Avoid_: Tooltip, ayuda contextual

## Propuestas

**Propuesta**:
Solicitud de un usuario para agregar algo compartido (un aparato al catálogo, una tarifa, una ciudad o una empresa proveedora) que queda pendiente hasta que el administrador la aprueba o la rechaza. Mientras está pendiente, quien la hizo puede seguir usando lo suyo.
_Avoid_: Solicitud, sugerencia

## Metas

**Periodo**:
Lapso de una meta: empieza el día siguiente al fin de la factura en que se basa y dura lo mismo que esa factura (fin estimado). Se cierra con las fechas reales de la factura siguiente.
_Avoid_: Mes, ciclo de facturación

**Periodo con meta modificada**:
Periodo en el que el usuario cambió el porcentaje de reducción antes de cerrarlo. Se compara con la última meta y la recomendación parte del último porcentaje; queda excluido de los datos para el trabajo futuro de machine learning.

**Periodo extendido**:
Periodo cuyo fin estimado ya pasó sin que el usuario haya registrado la factura siguiente. Sigue abierto hasta que la registre.

**Consumo calculado al cierre**:
Consumo calculado del periodo, congelado en el momento en que la factura lo cierra; se conserva junto al consumo facturado.

**Nuevo ciclo**:
Momento en que, tras cerrar un periodo, el usuario elige mantener, ahorrar más o ahorrar menos. Si superó la meta, "ahorrar menos" viene preseleccionado con el porcentaje anterior menos 5 puntos (mínimo 1 %).
_Avoid_: Renovación, reinicio de meta
