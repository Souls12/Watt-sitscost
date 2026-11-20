# Supabase como backend, con los cálculos en Postgres

La ERS habla de "un backend" y "un servidor"; no hay servidor propio: el backend es Supabase (Postgres, Auth, API REST sobre HTTPS) y la app es React Native con Expo. Los cálculos del dominio (consumo calculado, costo aproximado, meta, presupuesto diario, excedente, comparación de factura, recomendación) viven en vistas y funciones de Postgres, no en la app, para que den el mismo resultado en cualquier teléfono y el costo aproximado nunca se almacene. La seguridad (RNF-004) se aplica con RLS en todas las tablas; el rol de administrador se asigna a mano en la base de datos.


Todas las fechas del dominio ("hoy", días restantes, día de un registro de uso) se calculan en Postgres en la zona horaria America/Bogota, no con la hora del teléfono. El periodo es una tabla explícita que la factura siguiente cierra mediante una función de Postgres, congelando el consumo calculado al cierre (dato para el trabajo futuro de machine learning); corregir o eliminar esa factura recalcula o reabre el periodo.
