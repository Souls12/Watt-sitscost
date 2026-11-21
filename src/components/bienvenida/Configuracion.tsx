import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Button, HelperText, Icon, ProgressBar, Text, TextInput, useTheme } from 'react-native-paper';
import { CampoFecha } from '@/components/CampoFecha';
import { useTarifa } from '@/components/CampoTarifa';
import { Formulario } from '@/components/Formulario';
import { GuiaFactura } from '@/components/GuiaFactura';
import { Nota } from '@/components/Nota';
import { type Referencia } from '@/lib/aparatos';
import { TIPOS_COMUNES, referenciaTipica } from '@/lib/bienvenida';
import { PORCENTAJES, calcularMeta, validarFactura } from '@/lib/factura';
import { hoyIso } from '@/lib/fechas';
import { formatDuration, formatEnergy, formatMoney, formatPower, formatTarifa } from '@/lib/format';
import { useSesion } from '@/lib/sesion';
import { supabase } from '@/lib/supabase';
import { leerTarifa } from '@/lib/tarifa';
import { Luna, Presionable, entra, paginaEntra, paginaSale } from '@/motion';

type Paso = 'tarifa' | 'aparatos' | 'factura' | 'meta' | 'listo';
const PASOS: Paso[] = ['tarifa', 'aparatos', 'factura', 'meta'];
const TITULOS: Record<Paso, string> = {
  tarifa: 'Tu tarifa',
  aparatos: 'Tus aparatos',
  factura: 'Tu factura',
  meta: 'Tu meta',
  listo: 'Todo listo',
};

type Ficha = Pick<Referencia, 'id' | 'tipo' | 'potencia_w'>;

// Configuración guiada: una pregunta por pantalla. Tarifa y aparatos dan datos al Mes; factura y meta son opcionales.
export function Configuracion({ onTerminar }: { onTerminar: () => void }) {
  const theme = useTheme();
  const { session } = useSesion();
  const [paso, setPaso] = useState<Paso>('tarifa');
  const [adelante, setAdelante] = useState(true);
  const ir = (p: Paso) => {
    setAdelante(PASOS.indexOf(p) >= PASOS.indexOf(paso) || p === 'listo');
    setPaso(p);
  };

  // Tarifa
  const { texto, setTexto, campo, validar } = useTarifa(false);
  const [tarifaActual, setTarifaActual] = useState<number | null>(null);
  const [explicar, setExplicar] = useState(false);
  // Aparatos
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [agregados, setAgregados] = useState<Record<string, number>>({});
  const [ocupado, setOcupado] = useState<string | null>(null);
  // Factura y meta
  const [kwh, setKwh] = useState('');
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [verGuia, setVerGuia] = useState(false);
  const [factura, setFactura] = useState<{ id: number; kwh: number } | null>(null);
  const [pct, setPct] = useState(10);
  const [metaGuardada, setMetaGuardada] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    supabase.rpc('tarifa_vigente', { p_usuario: session.user.id }).then(({ data }) => {
      const v = Number(data ?? 0);
      if (v > 0) {
        setTarifaActual(v);
        setTexto(String(v).replace('.', ','));
      }
    });
    supabase
      .from('aparatos_referencia')
      .select('id, tipo, potencia_w')
      .eq('estado', 'aprobada')
      .then(({ data }) => setFichas(((data ?? []) as Ficha[]).map((f) => ({ ...f, potencia_w: Number(f.potencia_w) }))));
    supabase
      .from('aparatos')
      .select('id, tipo')
      .is('archivado_en', null)
      .then(({ data }) => {
        const m: Record<string, number> = {};
        for (const a of data ?? []) if (TIPOS_COMUNES.some((t) => t.tipo === a.tipo)) m[a.tipo] = a.id;
        setAgregados(m);
      });
  }, [session, setTexto]);

  const tarifaNueva = leerTarifa(texto);
  async function guardarTarifa() {
    if (tarifaNueva !== null && tarifaNueva !== tarifaActual) {
      const { error: e } = await supabase.from('tarifas_usuario').insert({ valor_kwh: tarifaNueva });
      if (e) return setError('No pudimos guardar la tarifa. Intenta de nuevo.');
      setTarifaActual(tarifaNueva);
    }
    setError(null);
    ir('aparatos');
  }

  async function alternar(t: (typeof TIPOS_COMUNES)[number]) {
    const id = agregados[t.tipo];
    setOcupado(t.tipo);
    setError(null);
    if (id) {
      const { error: e } = await supabase.from('aparatos').update({ archivado_en: new Date().toISOString() }).eq('id', id);
      if (e) setError('No pudimos quitarlo. Intenta de nuevo.');
      else setAgregados(({ [t.tipo]: _, ...resto }) => resto);
    } else {
      const ref = referenciaTipica(fichas, t.tipo);
      if (!ref) setError('No pudimos cargar la lista de aparatos. Revisa tu conexión.');
      else {
        const { data, error: e } = await supabase
          .from('aparatos')
          .insert({
            nombre: t.nombre,
            tipo: t.tipo,
            potencia_w: ref.potencia_w,
            cantidad: 1,
            uso_tipico_horas: t.horas,
            uso_constante: !!t.constante,
            referencia_id: ref.id,
          })
          .select('id')
          .single();
        if (e || !data) setError('No pudimos agregarlo. Intenta de nuevo.');
        else setAgregados((a) => ({ ...a, [t.tipo]: data.id }));
      }
    }
    setOcupado(null);
  }

  async function guardarFactura() {
    const r = validarFactura(kwh, inicio, fin, hoyIso());
    if (!r.ok) return setError(r.error);
    const { data, error: e } = await supabase.from('facturas').insert(r.valor).select('id').single();
    if (e || !data)
      return setError(e?.code === '23P01' ? 'Esas fechas se cruzan con otra factura.' : 'No pudimos guardar la factura. Intenta de nuevo.');
    setFactura({ id: data.id, kwh: r.valor.kwh_facturado });
    setError(null);
    ir('meta');
  }

  async function guardarMeta() {
    const { error: e } = await supabase.from('periodos').insert({ factura_base_id: factura!.id, porcentaje: pct });
    if (e) return setError('No pudimos crear tu periodo. Intenta de nuevo.');
    setMetaGuardada(pct);
    setError(null);
    ir('listo');
  }

  const n = Object.keys(agregados).length;
  const meta = factura && tarifaActual ? calcularMeta(factura.kwh, pct, tarifaActual) : null;
  const progreso = paso === 'listo' ? 1 : (PASOS.indexOf(paso) + 1) / PASOS.length;
  const grande = { height: 56 } as const;
  const err = (
    <HelperText type="error" visible={!!error}>
      {error}
    </HelperText>
  );

  return (
    <Formulario titulo={TITULOS[paso]}>
      {paso !== 'listo' && (
        <View style={{ gap: 6 }} accessible accessibilityLabel={`Paso ${PASOS.indexOf(paso) + 1} de ${PASOS.length}`}>
          <Text variant="labelLarge">{`Paso ${PASOS.indexOf(paso) + 1} de ${PASOS.length}`}</Text>
          <ProgressBar progress={progreso} style={{ height: 8, borderRadius: 4 }} />
        </View>
      )}
      <Animated.View key={paso} entering={paginaEntra(adelante)} exiting={paginaSale(adelante)} style={{ gap: 12 }}>
        {paso === 'tarifa' && (
          <>
            <Text variant="titleLarge">¿Cuánto pagas por cada kWh?</Text>
            <Text variant="bodyLarge">Con este valor calculamos cuánto cuesta lo que gastas. Ya pusimos el que nos diste al registrarte.</Text>
            {campo}
            <Button icon="help-circle-outline" onPress={() => setExplicar((v) => !v)} contentStyle={{ minHeight: 48 }}>
              No sé mi tarifa
            </Button>
            {explicar && (
              <Animated.View
                entering={entra()}
                style={{ borderRadius: 12, padding: 16, gap: 8, backgroundColor: theme.colors.surfaceVariant }}
              >
                <Text variant="titleSmall">¿Dónde la encuentro?</Text>
                <Text variant="bodyMedium">
                  En tu factura de energía busca “Valor kWh”, “Costo unitario” o “Tarifa”. Es lo que pagas por cada kWh y casi siempre es un número de unos cientos de pesos. No es el total a pagar.
                </Text>
                <Text variant="bodyMedium">
                  Si no la encuentras, deja el valor que ves: es aproximado y lo puedes cambiar después en Mi cuenta, en Mi tarifa.
                </Text>
                <GuiaFactura foco="tarifa" />
              </Animated.View>
            )}
            {err}
            <Button mode="contained" contentStyle={grande} labelStyle={{ fontSize: 18 }} onPress={() => validar(guardarTarifa)}>
              Seguir
            </Button>
          </>
        )}

        {paso === 'aparatos' && (
          <>
            <Text variant="titleLarge">¿Qué aparatos tienes en casa?</Text>
            <Text variant="bodyLarge">Toca los que usas. Los agregamos con valores típicos; luego los ajustas a los tuyos.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {TIPOS_COMUNES.map((t, i) => {
                const puesto = !!agregados[t.tipo];
                const ficha = referenciaTipica(fichas, t.tipo);
                return (
                  <Animated.View key={t.tipo} entering={entra(i)} style={{ flexBasis: '47%', flexGrow: 1 }}>
                    <Presionable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: puesto, disabled: ocupado === t.tipo }}
                      accessibilityLabel={`${t.nombre}${ficha ? `, ${formatPower(ficha.potencia_w)}` : ''}`}
                      disabled={ocupado !== null}
                      onPress={() => alternar(t)}
                      style={{
                        minHeight: 120,
                        borderRadius: 16,
                        borderWidth: 2,
                        borderColor: puesto ? theme.colors.primary : theme.colors.outline,
                        backgroundColor: puesto ? theme.colors.primaryContainer : theme.colors.surface,
                        padding: 12,
                        gap: 4,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Icon source={t.icono} size={32} color={puesto ? theme.colors.onPrimaryContainer : theme.colors.onSurface} />
                        {puesto && <Icon source="check-circle" size={24} color={theme.colors.onPrimaryContainer} />}
                      </View>
                      <Text variant="titleSmall" style={{ color: puesto ? theme.colors.onPrimaryContainer : theme.colors.onSurface }}>
                        {t.nombre}
                      </Text>
                      {ficha && (
                        <Text variant="bodySmall" style={{ color: puesto ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}>
                          {`${formatPower(ficha.potencia_w)} · ${formatDuration(t.horas * 60)} al día`}
                        </Text>
                      )}
                    </Presionable>
                  </Animated.View>
                );
              })}
            </View>
            <Nota>La nevera no trabaja todo el día: su motor se prende y apaga. Contamos unas 8 h al día.</Nota>
            <Nota>Usamos la potencia típica de cada tipo de aparato; puedes ajustarla en Aparatos.</Nota>
            <Nota>La nevera se registra sola cada noche, así no tienes que reportarla.</Nota>
            <Text variant="bodyMedium">¿Falta alguno? Después puedes agregar más en la pestaña Aparatos.</Text>
            {err}
            <Button mode="contained" contentStyle={grande} labelStyle={{ fontSize: 18 }} onPress={() => ir('factura')}>
              {n ? `Seguir (${n} ${n === 1 ? 'aparato' : 'aparatos'})` : 'Lo haré después'}
            </Button>
            <Button contentStyle={{ minHeight: 48 }} onPress={() => ir('tarifa')}>Atrás</Button>
          </>
        )}

        {paso === 'factura' && (
          <>
            <Text variant="titleLarge">¿Tienes tu última factura a la mano?</Text>
            <Text variant="bodyLarge">Con ella te proponemos una meta de ahorro. Es opcional: puedes hacerlo después en la pestaña Factura.</Text>
            <Button icon="help-circle-outline" onPress={() => setVerGuia((v) => !v)} contentStyle={{ minHeight: 48 }}>
              ¿Dónde lo encuentro?
            </Button>
            {verGuia && <GuiaFactura />}
            <TextInput label="Consumo facturado (kWh)" value={kwh} onChangeText={setKwh} keyboardType="decimal-pad" />
            <CampoFecha label="Inicio del consumo" value={inicio} onChange={setInicio} maxima={hoyIso()} />
            <CampoFecha label="Fin del consumo" value={fin} onChange={setFin} maxima={hoyIso()} />
            {err}
            <Button mode="contained" contentStyle={grande} labelStyle={{ fontSize: 18 }} onPress={guardarFactura}>
              Guardar factura
            </Button>
            <Button contentStyle={{ minHeight: 48 }} onPress={() => { setError(null); ir('listo'); }}>Ahora no</Button>
            <Button contentStyle={{ minHeight: 48 }} onPress={() => { setError(null); ir('aparatos'); }}>Atrás</Button>
          </>
        )}

        {paso === 'meta' && (
          <>
            <Text variant="titleLarge">¿Cuánto quieres bajar?</Text>
            <Text variant="bodyLarge">Elige cuánto menos que tu factura quieres gastar este periodo. Si dudas, empieza con 10 %.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {PORCENTAJES.map((p) => (
                <Button key={p} style={{ flexGrow: 1 }} contentStyle={{ height: 48 }} mode={pct === p ? 'contained-tonal' : 'outlined'} onPress={() => setPct(p)}>{`${p} %`}</Button>
              ))}
            </View>
            {meta && <Text variant="titleMedium">{`Tu meta: ${formatEnergy(meta.kwh)}, unos ${formatMoney(meta.pesos)}`}</Text>}
            {err}
            <Button mode="contained" contentStyle={grande} labelStyle={{ fontSize: 18 }} onPress={guardarMeta}>
              Empezar mi periodo
            </Button>
            <Button contentStyle={{ minHeight: 48 }} onPress={() => { setError(null); ir('listo'); }}>Ahora no</Button>
          </>
        )}

        {paso === 'listo' && (
          <>
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <LunaFinal />
            </View>
            <Text variant="headlineSmall" style={{ textAlign: 'center' }}>¡Listo, ya puedes empezar!</Text>
            <Text variant="bodyLarge">
              {n
                ? `Agregaste ${n} ${n === 1 ? 'aparato' : 'aparatos'}. `
                : 'Aún no agregaste aparatos: hazlo cuando quieras en la pestaña Aparatos. '}
              {tarifaActual ? `Tu tarifa es ${formatTarifa(tarifaActual)} por kWh. ` : ''}
              {metaGuardada ? `Tu meta es bajar ${metaGuardada} %. ` : 'Puedes definir tu meta cuando tengas tu factura. '}
            </Text>
            <Text variant="bodyLarge">En tu Mes, toca “Reportar uso” cada día para ver cómo vas. Puedes repasar la ayuda en Mi cuenta.</Text>
            <Button mode="contained" contentStyle={grande} labelStyle={{ fontSize: 18 }} onPress={onTerminar}>
              Ir a mi Mes
            </Button>
          </>
        )}
      </Animated.View>
    </Formulario>
  );
}

// La luna se llena al llegar: el primer momento de logro.
function LunaFinal() {
  const [l, setL] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setL(1), 300);
    return () => clearTimeout(t);
  }, []);
  return <Luna llenado={l} size={120} />;
}
