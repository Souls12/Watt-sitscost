import { type ReactNode, useState } from 'react';
import { View } from 'react-native';
import { Icon, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { Nota } from '@/components/Nota';
import { tarifaNeta } from '@/lib/tarifa';

type Variante = 'afinia' | 'generica';
type Foco = 'consumo' | 'tarifa';

// Factura ilustrada: marca dónde están el consumo facturado (kWh) y las fechas del periodo (foco 'consumo'),
// o la tarifa en $/kWh (foco 'tarifa'). Con `onTarifa` y foco 'tarifa' suma una calculadora que llena el campo de tarifa.
// Los números del dibujo son inventados.
export function GuiaFactura({ foco = 'consumo', onTarifa }: { foco?: Foco; onTarifa?: (texto: string) => void }) {
  const [v, setV] = useState<Variante>('afinia');
  return (
    <View style={{ gap: 8 }}>
      <SegmentedButtons
        value={v}
        onValueChange={(x) => setV(x as Variante)}
        buttons={[
          { value: 'afinia', label: 'Afinia' },
          { value: 'generica', label: 'Otra empresa' },
        ]}
      />
      {v === 'afinia' ? <GuiaAfinia foco={foco} /> : <GuiaGenerica foco={foco} />}
      {foco === 'tarifa' && onTarifa && <CalculadoraTarifa onTarifa={onTarifa} />}
    </View>
  );
}

const PASOS: Record<Foco, string[]> = {
  consumo: [
    'Al frente, en “Resumen facturación mes”, mira “Periodo facturado”: la primera fecha es el inicio y la segunda el fin. (Atrás las ves como “Fecha Lectura Anterior” y “Fecha Lectura Actual”.)',
    'Atrás, en “Datos de lectura”, el número de “Consumo KWh” son tus kWh. Es el mismo de la barra “Período actual” del gráfico del frente.',
    'No uses “Total a Pagar” ni “Total Mes”: son pesos, no kWh.',
  ],
  tarifa: [
    'Busca atrás el cuadro “Datos de consumo”.',
    'En la fila “Consumo”, toma el número de la columna “Tarifa en $/kWh”.',
    'Si hay una fila “Subsidio” (estratos 1, 2 y 3), réstale ese valor a la tarifa. En estratos 5 y 6 puede aparecer una contribución que se suma.',
    'No uses el total a pagar.',
  ],
};

function GuiaAfinia({ foco }: { foco: Foco }) {
  const theme = useTheme();
  const tarifa = foco === 'tarifa';
  const pasos = PASOS[foco];
  const gris = theme.colors.onSurfaceVariant;

  // Cuadro de la factura; resaltado, lleva el número del paso que lo explica.
  const caja = (titulo: string, hijos: ReactNode, opts: { paso?: number; estilo?: object } = {}) => (
    <View
      style={[
        {
          borderWidth: opts.paso ? 2 : 1,
          borderColor: opts.paso ? theme.colors.primary : theme.colors.outline,
          backgroundColor: opts.paso ? theme.colors.primaryContainer : theme.colors.surface,
          borderRadius: 6,
          padding: 6,
          gap: 3,
        },
        opts.estilo,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {opts.paso && <Insignia n={opts.paso} />}
        <Text variant="labelSmall" style={{ flex: 1, color: opts.paso ? theme.colors.onPrimaryContainer : gris }}>
          {titulo}
        </Text>
      </View>
      {hijos}
    </View>
  );
  const fila = (a: string, b: string, resalta = false) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
      <Text variant="labelSmall" style={{ color: gris, flexShrink: 1 }}>{a}</Text>
      <Text variant="labelSmall" style={{ color: resalta ? theme.colors.onPrimaryContainer : gris, fontWeight: resalta ? '700' : '400' }}>{b}</Text>
    </View>
  );
  const no = (texto: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Icon source="close-circle" size={12} color={theme.colors.error} />
      <Text variant="labelSmall" style={{ color: theme.colors.error, fontWeight: '700' }}>No</Text>
      <Text variant="labelSmall" style={{ color: gris }}>{texto}</Text>
    </View>
  );

  const frente = (
    <Hoja titulo="Frente de la factura">
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 6 }}>
          {caja('Resumen facturación mes', fila('Periodo facturado', '20/09/2026 - 19/10/2026', true), { paso: 1 })}
          <View style={{ flexDirection: 'row', gap: 3, alignItems: 'center' }}>
            {['Energía', '+ Aseo', '+ Alumbrado', '+ Seguridad', '= Total mes'].map((t) => (
              <View key={t} style={{ flex: 1, aspectRatio: 1, borderRadius: 99, borderWidth: 1, borderColor: theme.colors.outline, alignItems: 'center', justifyContent: 'center' }}>
                <Text variant="labelSmall" style={{ color: gris, fontSize: 8, lineHeight: 10, textAlign: 'center' }} numberOfLines={2}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ width: '32%', borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.error, borderRadius: 6, padding: 6, gap: 2 }}>
          <Text variant="labelSmall" style={{ color: gris }}>Total a Pagar</Text>
          <Text variant="labelSmall" style={{ color: gris }}>Total Mes</Text>
          {no('este')}
        </View>
      </View>
      {caja(
        'Consumo de los últimos 6 meses (kWh)',
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 62 }}>
          {[28, 34, 30, 40, 36, 46].map((h, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
              {i === 5 && <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer, fontWeight: '700' }}>184</Text>}
              <View style={{ width: '100%', height: h, borderRadius: 2, backgroundColor: i === 5 ? theme.colors.primary : theme.colors.outlineVariant }} />
            </View>
          ))}
        </View>,
        { paso: 2 },
      )}
      <Text variant="labelSmall" style={{ color: gris, textAlign: 'right' }}>La última barra: “Período actual (kWh)”</Text>
    </Hoja>
  );

  const atras = (
    <Hoja titulo="Parte de atrás">
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {caja(
          'Datos de lectura',
          <>
            {fila('Fecha Lectura Anterior', '19/09/2026', !tarifa)}
            {fila('Fecha Lectura Actual', '19/10/2026', !tarifa)}
            {fila('Días Facturados', '30')}
          </>,
          { paso: tarifa ? undefined : 1, estilo: { flex: 1 } },
        )}
        {caja('Consumo KWh', <Text variant="titleSmall" style={{ color: tarifa ? gris : theme.colors.onPrimaryContainer }}>184</Text>, {
          paso: tarifa ? undefined : 2,
          estilo: { width: '28%' },
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {caja(
          'Costo unitario $/kWh',
          <>
            {fila('G · T · PR', '…')}
            {fila('R · D · C', '…')}
            {fila('CU', '1.050,20')}
          </>,
          { estilo: { flex: 2 } },
        )}
        {caja(
          'Datos de consumo',
          <>
            {fila('Tarifa $/kWh', 'kWh')}
            {fila('Consumo', '1.012,35', tarifa)}
            {fila('Subsidio', '405,00', tarifa)}
          </>,
          { paso: tarifa ? 1 : undefined, estilo: { flex: 3 } },
        )}
      </View>
      {tarifa && (
        <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer, fontWeight: '700' }}>
          Ejemplo: 1.012,35 − 405,00 = 607,35 $/kWh
        </Text>
      )}
    </Hoja>
  );

  return (
    <View
      accessible
      accessibilityLabel={`Guía para la factura de Afinia. ${pasos.map((p, i) => `${i + 1}. ${p}`).join(' ')}`}
      style={{ gap: 10 }}
    >
      {!tarifa && frente}
      {atras}
      <View style={{ gap: 6 }}>
        {pasos.map((p, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <Insignia n={i + 1} grande />
            <Text variant="bodyMedium" style={{ flex: 1 }}>{p}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Hoja({ titulo, children }: { titulo: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{ borderRadius: 10, borderWidth: 1, borderColor: theme.colors.outline, backgroundColor: theme.colors.surfaceVariant, padding: 8, gap: 6 }}
    >
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>{titulo}</Text>
      {children}
    </View>
  );
}

// Número del paso, igual en el dibujo y en la lista.
function Insignia({ n, grande = false }: { n: number; grande?: boolean }) {
  const theme = useTheme();
  const d = grande ? 24 : 16;
  return (
    <View style={{ width: d, height: d, borderRadius: d / 2, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: theme.colors.onPrimary, fontSize: grande ? 14 : 10, lineHeight: grande ? 18 : 12, fontWeight: '700' }}>{n}</Text>
    </View>
  );
}

// Otras empresas: no conocemos su diseño, solo qué buscar.
function GuiaGenerica({ foco }: { foco: Foco }) {
  const theme = useTheme();
  const tarifa = foco === 'tarifa';
  const linea = (ancho: `${number}%`) => (
    <View style={{ height: 8, width: ancho, borderRadius: 4, backgroundColor: theme.colors.outline }} />
  );
  const marca = (etiqueta: string, valor: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: theme.colors.primary, borderRadius: 8, padding: 8, backgroundColor: theme.colors.surface }}>
      <Text variant="labelLarge" style={{ flex: 1 }}>{etiqueta}</Text>
      <Text variant="titleMedium" style={{ color: theme.colors.primary }}>{valor}</Text>
    </View>
  );
  return (
    <View
      accessible
      accessibilityLabel={
        tarifa
          ? 'Guía: en tu factura busca "Valor kWh" o "Costo unitario", el valor en pesos por kWh. No uses el total a pagar.'
          : 'Guía: en tu factura busca el consumo en kWh del mes y las fechas del periodo de consumo, desde y hasta.'
      }
      style={{ borderWidth: 2, borderColor: theme.colors.outline, borderRadius: 12, padding: 12, gap: 8, backgroundColor: theme.colors.surfaceVariant }}
    >
      <Text variant="titleSmall">Factura de energía</Text>
      {linea('70%')}
      {tarifa ? (
        <>
          {marca('Valor kWh', '$ 812,40 /kWh')}
          {linea('50%')}
        </>
      ) : (
        <>
          {marca('Fechas de consumo', '2026-09-20 a 2026-10-19')}
          {linea('50%')}
          {marca('Consumo (kWh)', '184 kWh')}
          {linea('60%')}
        </>
      )}
      <Text variant="bodySmall">
        {tarifa
          ? 'Busca “Valor kWh” o “Costo unitario”, en $/kWh: unos cientos de pesos. Si aparece un subsidio por kWh, réstalo. No uses el total a pagar.'
          : 'Busca los kWh del mes y las fechas “desde” y “hasta” del consumo. No uses la fecha de pago ni el total en pesos.'}
      </Text>
    </View>
  );
}

// Calcula tarifa − subsidio y llena el campo de tarifa mientras se escribe.
function CalculadoraTarifa({ onTarifa }: { onTarifa: (texto: string) => void }) {
  const [tarifa, setTarifa] = useState('');
  const [subsidio, setSubsidio] = useState('');
  const cambiar = (t: string, s: string) => {
    setTarifa(t);
    setSubsidio(s);
    const neta = tarifaNeta(t, s);
    if (neta) onTarifa(neta);
  };
  const neta = tarifaNeta(tarifa, subsidio);
  return (
    <View style={{ gap: 8, paddingTop: 4 }}>
      <Text variant="titleSmall">Calcúlala aquí</Text>
      <TextInput label="Tarifa en $/kWh" mode="outlined" value={tarifa} onChangeText={(t) => cambiar(t, subsidio)} keyboardType="decimal-pad" left={<TextInput.Affix text="$" />} />
      <TextInput label="Subsidio en $/kWh (si aparece)" mode="outlined" value={subsidio} onChangeText={(s) => cambiar(tarifa, s)} keyboardType="decimal-pad" left={<TextInput.Affix text="$" />} />
      <Text variant="titleMedium">{neta ? `Tu tarifa: $${neta} por kWh (ya está en el campo)` : 'Escribe la tarifa para calcularla.'}</Text>
      <Nota>El subsidio solo cubre el consumo básico (de subsistencia). Si gastas bastante más que eso, tu tarifa real es un poco mayor: este valor es aproximado.</Nota>
    </View>
  );
}
