import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Almanaque } from '@/components/Almanaque';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Badge, FAB, IconButton, Snackbar, Text } from 'react-native-paper';
import { EstadoVacio } from '@/components/EstadoVacio';
import { CierrePeriodo } from '@/components/CierrePeriodo';
import { DetalleDia } from '@/components/DetalleDia';
import { HojaReporte } from '@/components/HojaReporte';
import { Pantalla } from '@/components/Pantalla';
import { Nota } from '@/components/Nota';
import { formatEnergy, formatMoney } from '@/lib/format';
import { usePanelUso } from '@/lib/usePanelUso';
import { useNoLeidos } from '@/lib/avisos';
import { Cifra, Racha } from '@/motion';
import { encabezado } from '@/theme';

// Mes: consumo calculado del mes y racha, con el reporte de uso en 3 toques. El ticket del periodo lo completa.
export default function Mes() {
  const { panel, hoy, dias, cifra, cargar, reportar } = usePanelUso();
  const noLeidos = useNoLeidos();
  const [abierta, setAbierta] = useState(false);
  const [dia, setDia] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Otras pantallas (Semanas vacía) mandan aquí con ?reportar=1 para abrir la hoja de reporte.
  const { reportar: pedirReporte } = useLocalSearchParams<{ reportar?: string }>();
  useEffect(() => {
    if (pedirReporte === '1') {
      setAbierta(true);
      router.setParams({ reportar: undefined });
    }
  }, [pedirReporte]);
  useFocusEffect(
    useCallback(() => {
      cargar().then(setError);
    }, [cargar]),
  );

  return (
    <View style={{ flex: 1 }}>
      <Pantalla
        titulo="Mes"
        derecha={
          <>
            <View>
              <IconButton
                icon={noLeidos ? 'bell-badge-outline' : 'bell-outline'}
                iconColor={encabezado.texto}
                style={{ margin: 0, width: 48, height: 48 }}
                accessibilityLabel={noLeidos ? `Avisos, ${noLeidos} sin leer` : 'Avisos'}
                onPress={() => router.push('/avisos')}
              />
              <Badge visible={noLeidos > 0} size={18} style={{ position: 'absolute', top: 2, right: 2 }}>
                {noLeidos}
              </Badge>
            </View>
            <IconButton
              icon="account-circle"
              iconColor={encabezado.texto}
              style={{ margin: 0, width: 48, height: 48 }}
              accessibilityLabel="Mi cuenta"
              onPress={() => router.push('/cuenta')}
            />
          </>
        }
      >
        <ScrollView contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 96 }}>
          <CierrePeriodo onListo={cargar} />
          {hoy ? (
            <>
              <Text variant="labelLarge">Hoy puedes gastar</Text>
              <Cifra
                valor={
                  cifra === 'pesos'
                    ? formatMoney(hoy.presupuesto_hoy * hoy.tarifa_kwh)
                    : formatEnergy(hoy.presupuesto_hoy)
                }
              />
              <Text>
                {cifra === 'pesos'
                  ? formatEnergy(hoy.presupuesto_hoy)
                  : formatMoney(hoy.presupuesto_hoy * hoy.tarifa_kwh)}
              </Text>
              {hoy.meta_alcanzada && (
                <Text>
                  Llegaste a tu meta del periodo
                  {hoy.excedente > 0 ? ` y la pasaste por ${formatEnergy(hoy.excedente)}` : ''}. Está bien: puedes
                  seguir reportando.
                </Text>
              )}
              <Text>
                {hoy.estado === 'extendido'
                  ? 'Tu periodo se extendió: registra tu factura para cerrarlo.'
                  : `Faltan ${hoy.dias_restantes} días del periodo.`}
              </Text>
              <Nota>≈ calculado con tu tarifa; no es el total de tu factura.</Nota>
              <Racha dias={hoy.racha} />
            </>
          ) : (
            <>
              <Text variant="labelLarge">Consumo calculado del mes</Text>
              <Cifra valor={formatEnergy(panel.kwh)} />
              <Text>{formatMoney(panel.costo)}</Text>
              <Nota>≈ calculado con tu tarifa; no es el total de tu factura.</Nota>
              <Racha dias={panel.racha} />
              <EstadoVacio
                icono="flag-checkered"
                titulo="Aún no tienes una meta"
                texto="Con tu última factura fijas una meta de ahorro, y cada día te decimos cuánto puedes gastar."
                accion="Definir mi meta"
                onAccion={() => router.navigate('/factura')}
              />
            </>
          )}
          <Almanaque dias={dias} onDia={setDia} />
          {dias.length > 0 && <Nota>Toca un día para ver qué aparatos usaste y cuánto tiempo.</Nota>}
        </ScrollView>
      </Pantalla>
      <FAB
        icon="plus"
        label="Reportar uso"
        style={{ position: 'absolute', right: 16, bottom: 16 }}
        variant="primary"
        onPress={() => setAbierta(true)}
      />
      <HojaReporte
        visible={abierta}
        onCerrar={() => setAbierta(false)}
        onReportar={async (a, h) => setError(await reportar(a, h))}
      />
      <DetalleDia fecha={dia} onCerrar={() => setDia(null)} />
      <Snackbar visible={!!error} onDismiss={() => setError(null)} duration={5000}>
        {error}
      </Snackbar>
    </View>
  );
}
