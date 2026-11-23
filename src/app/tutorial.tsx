import { router } from 'expo-router';
import { Button, List, Text } from 'react-native-paper';
import { Formulario } from '@/components/Formulario';

const SECCIONES = [
  {
    titulo: 'Tu tarifa',
    texto:
      'La tarifa es lo que pagas por cada kWh. Puedes escribir la tuya o elegir una tarifa compartida de tu ciudad, estrato y empresa. Solo cambia cuando tú lo decides: si hay una versión nueva, te llega un aviso y tú eliges si la usas.',
  },
  {
    titulo: 'Compartir una tarifa',
    texto:
      'Si tu tarifa no está, propónla: el administrador la revisa y, al aprobarla, otras personas de tu ciudad pueden usarla. Mientras tanto, tú sigues usando la tuya.',
  },
  {
    titulo: 'Cómo leer tu consumo y costo',
    texto:
      'El consumo se mide en kWh: la potencia del aparato por las horas que lo usas. El costo es un cálculo aproximado, kWh por tu tarifa vigente; no es el valor de tu factura. Compara tu avance con la meta del periodo para saber si vas bien.',
  },
];

// Fuera de los guards de rutas: se abre tanto en el registro como desde Cuenta.
export default function Tutorial() {
  return (
    <Formulario titulo="Cómo funciona" atras="/">
      <Text variant="bodyLarge">Tres ideas para sacarle provecho a la app.</Text>
      <List.AccordionGroup>
        {SECCIONES.map((s) => (
          <List.Accordion key={s.titulo} id={s.titulo} title={s.titulo} titleNumberOfLines={2}>
            <Text variant="bodyLarge" style={{ padding: 16 }}>
              {s.texto}
            </Text>
          </List.Accordion>
        ))}
      </List.AccordionGroup>
      {/* Sin historial (p. ej. abierta al iniciar), "/" lleva a la pantalla que la sesión permite. */}
      <Button onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>Volver</Button>
    </Formulario>
  );
}
