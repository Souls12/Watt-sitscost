import { useState } from 'react';
import { View } from 'react-native';
import { Button, List, Text, TextInput } from 'react-native-paper';

export type Opcion = { id: number; nombre: string; detalle?: string | null };
// Un elemento de la lista, o el texto de una propuesta ("No encuentro mi ciudad / empresa").
export type Eleccion = { id: number; nombre: string } | { propuesta: string } | null;

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function Selector({
  etiqueta,
  noEncuentro,
  opciones,
  eleccion,
  onCambio,
}: {
  etiqueta: string;
  noEncuentro: string;
  opciones: Opcion[];
  eleccion: Eleccion;
  onCambio: (e: Eleccion) => void;
}) {
  const [filtro, setFiltro] = useState('');

  if (eleccion && 'id' in eleccion)
    return (
      <View>
        <Text variant="labelLarge">{etiqueta}</Text>
        <List.Item
          title={eleccion.nombre}
          left={(p) => <List.Icon {...p} icon="check" />}
          right={() => <Button onPress={() => onCambio(null)}>Cambiar</Button>}
        />
      </View>
    );

  if (eleccion)
    return (
      <View>
        <TextInput
          label={`${etiqueta} (propuesta)`}
          mode="outlined"
          value={eleccion.propuesta}
          onChangeText={(t) => onCambio({ propuesta: t })}
        />
        <Text variant="bodySmall">La revisamos; mientras tanto puedes usar la app normalmente.</Text>
        <Button onPress={() => onCambio(null)}>Volver a la lista</Button>
      </View>
    );

  const visibles = opciones.filter((o) => sinTildes(o.nombre).includes(sinTildes(filtro))).slice(0, 6);
  return (
    <View>
      <TextInput label={etiqueta} mode="outlined" value={filtro} onChangeText={setFiltro} placeholder="Buscar" />
      {visibles.map((o) => (
        <List.Item
          key={o.id}
          title={o.nombre}
          description={o.detalle ?? undefined}
          onPress={() => onCambio({ id: o.id, nombre: o.nombre })}
        />
      ))}
      <List.Item
        title={noEncuentro}
        left={(p) => <List.Icon {...p} icon="plus" />}
        onPress={() => onCambio({ propuesta: filtro })}
      />
    </View>
  );
}
