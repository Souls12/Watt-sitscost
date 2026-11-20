import { Platform } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { TextInput } from 'react-native-paper';
import { aIso, deIso, fechaLarga } from '@/lib/fechas';

// Fecha elegida con el selector Material nativo de Android; el valor es AAAA-MM-DD (día local, sin UTC).
export function CampoFecha({
  label,
  value,
  onChange,
  maxima,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  maxima?: string;
}) {
  const abrir = () => {
    if (Platform.OS !== 'android') return;
    DateTimePickerAndroid.open({
      value: value ? deIso(value) : new Date(),
      mode: 'date',
      maximumDate: maxima ? deIso(maxima) : undefined,
      onValueChange: (_e, d) => onChange(aIso(d)),
    });
  };
  return (
    <TextInput
      label={label}
      value={value ? fechaLarga(value) : ''}
      placeholder="Toca para elegir"
      readOnly // no `editable={false}`: Paper lo pinta como deshabilitado (bajo contraste)
      showSoftInputOnFocus={false}
      right={<TextInput.Icon icon="calendar" onPress={abrir} accessibilityLabel={`Elegir ${label.toLowerCase()}`} />}
      onPressIn={abrir}
      accessibilityRole="button"
    />
  );
}
