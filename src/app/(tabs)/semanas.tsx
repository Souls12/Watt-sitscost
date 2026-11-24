import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { ScrollView, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, Icon, IconButton, Snackbar, Text, useTheme } from 'react-native-paper';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { router, useFocusEffect } from 'expo-router';
import { DetalleDia } from '@/components/DetalleDia';
import { EstadoVacio } from '@/components/EstadoVacio';
import { Acumulado, Columnas, Dona, LeyendaColumnas, Ranking, type Columna } from '@/components/Graficas';
import { Nota } from '@/components/Nota';
import { Pantalla } from '@/components/Pantalla';
import { useColoresTipo } from '@/lib/aparatos';
import { cargarPeriodos, cargarRegistros } from '@/lib/consumo';
import {
  MESES,
  cambio,
  consejos,
  proyectar,
  diaSemana,
  diasEntre,
  metaDia,
  metaRango,
  porAparato,
  porDia,
  porTipo,
  rangoMes,
  semanasDelMes,
  sumarDias,
  totales,
  type PeriodoMeta,
  type Rango,
  type Registro,
} from '@/lib/estadisticas';
import { hoyIso } from '@/lib/fechas';
import { formatDuration, formatEnergy, formatMoney } from '@/lib/format';
import { rangoSemana } from '@/lib/semanas';

const LETRAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

// Semanas: el mes calendario en general (comparado con el anterior) y, al elegir una semana, su detalle día a día.
export default function Semanas() {
  const theme = useTheme();
  const colores = useColoresTipo();
  const color = (tipo: string) => colores[tipo] ?? theme.colors.outline;
  const hoy = hoyIso();
  const [mes, setMes] = useState({ anio: +hoy.slice(0, 4), mes: +hoy.slice(5, 7) - 1 });
  const [sel, setSel] = useState<number | null>(null);
  const [rs, setRs] = useState<Registro[] | null>(null);
  const [periodos, setPeriodos] = useState<PeriodoMeta[]>([]);
  const [error, setError] = useState(false);
  const [dia, setDia] = useState<string | null>(null);

  const rango = rangoMes(mes.anio, mes.mes);
  const ant = mes.mes === 0 ? { anio: mes.anio - 1, mes: 11 } : { anio: mes.anio, mes: mes.mes - 1 };
  const rangoAnt = rangoMes(ant.anio, ant.mes);
  const esActual = hoy <= rango.hasta;

  const cargar = useCallback(() => {
    Promise.all([cargarRegistros(rangoAnt.desde, rango.hasta), cargarPeriodos()])
      .then(([r, p]) => {
        setRs(r);
        setPeriodos(p);
      })
      .catch(() => setError(true));
  }, [rangoAnt.desde, rango.hasta]);
  useFocusEffect(cargar);

  const irMes = (m: { anio: number; mes: number }) => {
    setMes(m);
    setSel(null);
    setRs(null);
  };
  const sig = mes.mes === 11 ? { anio: mes.anio + 1, mes: 0 } : { anio: mes.anio, mes: mes.mes + 1 };
  const semanas = semanasDelMes(mes.anio, mes.mes);
  const hayDatos = !!rs?.some((r) => r.fecha >= rango.desde);

  return (
    <Pantalla titulo="Semanas">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton icon="chevron-left" size={28} onPress={() => irMes(ant)} accessibilityLabel={`Ver ${MESES[ant.mes]} ${ant.anio}`} />
          <Text variant="titleLarge" accessibilityRole="header">{`${MESES[mes.mes]} ${mes.anio}`}</Text>
          <IconButton
            icon="chevron-right"
            size={28}
            disabled={esActual}
            onPress={() => irMes(sig)}
            accessibilityLabel={esActual ? 'Ya estás en el mes actual' : `Ver ${MESES[sig.mes]} ${sig.anio}`}
          />
        </View>

        {!rs ? (
          <ActivityIndicator accessibilityLabel="Cargando" style={{ marginTop: 32 }} />
        ) : !hayDatos ? (
          esActual ? (
            <EstadoVacio
              icono="calendar-week"
              titulo="Aún no hay registros este mes"
              texto="Cuando reportes el uso de un aparato, aquí verás tu mes, cada semana y la comparación con el mes pasado."
              accion="Reportar uso"
              onAccion={() => router.navigate({ pathname: '/', params: { reportar: '1' } })}
            />
          ) : (
            <Text variant="bodyLarge">{`No hay registros en ${MESES[mes.mes].toLowerCase()} de ${mes.anio}.`}</Text>
          )
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Chip selected={sel === null} showSelectedCheck={false} mode={sel === null ? 'flat' : 'outlined'} onPress={() => setSel(null)} style={{ minHeight: 40, justifyContent: 'center' }}>
                Todo el mes
              </Chip>
              {semanas.map((s, i) => (
                <Chip
                  key={s.desde}
                  selected={sel === i}
                  showSelectedCheck={false}
                  mode={sel === i ? 'flat' : 'outlined'}
                  disabled={s.desde > hoy}
                  onPress={() => setSel(i)}
                  accessibilityLabel={`Semana ${i + 1}, ${rangoSemana(s.desde, s.hasta)}`}
                  style={{ minHeight: 40, justifyContent: 'center' }}
                >
                  {`Sem ${i + 1} · ${rangoSemana(s.desde, s.hasta)}`}
                </Chip>
              ))}
            </ScrollView>

            {sel === null ? (
              <VistaMes
                rs={rs}
                periodos={periodos}
                rango={rango}
                rangoAnt={rangoAnt}
                nombreAnt={MESES[ant.mes]}
                semanas={semanas}
                hoy={hoy}
                esActual={esActual}
                color={color}
                onSemana={setSel}
              />
            ) : (
              <VistaSemana rs={rs} periodos={periodos} semana={semanas[sel]} hoy={hoy} color={color} onDia={setDia} />
            )}
          </>
        )}
      </ScrollView>
      <DetalleDia fecha={dia} onCerrar={() => setDia(null)} onCambio={cargar} />
      <Snackbar visible={error} onDismiss={() => setError(false)} duration={5000}>
        No pudimos actualizar tus datos. Revisa tu conexión.
      </Snackbar>
    </Pantalla>
  );
}

function Seccion({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <Card mode="outlined">
      <Card.Content style={{ gap: 10 }}>
        <Text variant="titleMedium" accessibilityRole="header">
          {titulo}
        </Text>
        {ayuda && <Text variant="bodyMedium">{ayuda}</Text>}
        {children}
      </Card.Content>
    </Card>
  );
}

// "15 % menos que …" con flecha; bajar es bueno, así que va en el color secundario y subir en el terciario.
function Cambio({ ahora, antes, contra }: { ahora: number; antes: number; contra: string }) {
  const { colors } = useTheme();
  const c = cambio(ahora, antes);
  if (c === null) return <Text variant="bodyMedium">{`Sin datos de ${contra} para comparar.`}</Text>;
  const igual = c === 0;
  const baja = c < 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon source={igual ? 'equal' : baja ? 'arrow-down-bold' : 'arrow-up-bold'} size={22} color={baja ? colors.secondary : igual ? colors.onSurface : colors.tertiary} />
      <Text variant="titleSmall" style={{ flex: 1 }}>
        {igual ? `Igual que ${contra}` : `${Math.abs(c)} % ${baja ? 'menos' : 'más'} que ${contra}`}
      </Text>
    </View>
  );
}

function VistaMes(p: {
  rs: Registro[];
  periodos: PeriodoMeta[];
  rango: Rango;
  rangoAnt: Rango;
  nombreAnt: string;
  semanas: Rango[];
  hoy: string;
  esActual: boolean;
  color: (tipo: string) => string;
  onSemana: (i: number) => void;
}) {
  const { rs, periodos, rango, rangoAnt, hoy, esActual } = p;
  // En el mes en curso se compara contra los mismos días del mes anterior, para no comparar medio mes con uno entero.
  const hasta = esActual ? hoy : rango.hasta;
  const n = diasEntre(rango.desde, hasta);
  const antHasta = sumarDias(rangoAnt.desde, n) < rangoAnt.hasta ? sumarDias(rangoAnt.desde, n) : rangoAnt.hasta;
  const t = totales(rs, rango);
  const tAnt = totales(rs, { desde: rangoAnt.desde, hasta: antHasta });

  const columnas: Columna[] = p.semanas.map((s, i) => {
    const futura = s.desde > hoy;
    const kwh = futura ? null : totales(rs, s).kwh;
    const meta = metaRango(periodos, s);
    return {
      clave: String(i),
      etiqueta: `Sem ${i + 1}`,
      kwh,
      meta,
      hablado: `Semana ${i + 1}, ${rangoSemana(s.desde, s.hasta)}: ${kwh === null ? 'aún no empieza' : formatEnergy(kwh)}${meta !== null ? `, meta ${formatEnergy(meta)}` : ''}${kwh !== null && meta !== null && kwh > meta ? ', se pasó de la meta' : ''}. Toca para ver la semana.`,
    };
  });
  const hayMeta = columnas.some((c) => c.meta !== null);

  let real = 0;
  let meta: number | null = null;
  const puntos = porDia(rs, rango).map((d, i) => {
    real += d.kwh;
    const m = metaDia(periodos, d.fecha);
    if (m !== null) meta = (meta ?? 0) + m;
    return { dia: i + 1, real: d.fecha <= hoy ? real : null, meta };
  });
  const aHoy = puntos.filter((x) => x.real !== null).at(-1);
  const habladoAcum = `Llevas ${formatEnergy(aHoy?.real ?? 0)}${aHoy?.meta != null ? ` y la meta hasta ese día es ${formatEnergy(aHoy.meta)}` : ''}.`;

  const aparatos = porAparato(rs, rango);
  const tipos = porTipo(rs, rango).map((x) => ({ ...x, color: p.color(x.tipo) }));
  const tips = consejos(rs, rango, hoy);
  const diasMes = diasEntre(rango.desde, rango.hasta) + 1;
  const proy = esActual ? { kwh: proyectar(t.kwh, n + 1, diasMes), costo: proyectar(t.costo, n + 1, diasMes) } : null;
  const metaMes = metaRango(periodos, rango);

  // Foto de la tarjeta de resumen para compartirla (WhatsApp, etc.).
  const fondo = useTheme().colors.background;
  const tarjeta = useRef<ComponentRef<typeof View>>(null);
  const [compartiendo, setCompartiendo] = useState(false);
  async function compartir() {
    setCompartiendo(true);
    try {
      const uri = await captureRef(tarjeta, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartir mi resumen' });
    } catch {
      // La persona canceló o el teléfono no permite compartir: no hay nada que deshacer.
    }
    setCompartiendo(false);
  }

  return (
    <>
      <View ref={tarjeta} collapsable={false} style={{ backgroundColor: fondo }}>
      <Seccion titulo={`Mi consumo de ${MESES[+rango.desde.slice(5, 7) - 1].toLowerCase()}`}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text variant="labelLarge">{esActual ? 'Este mes' : 'Ese mes'}</Text>
            <Text variant="headlineSmall">{formatEnergy(t.kwh)}</Text>
            <Text variant="bodyMedium">{formatMoney(t.costo)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="labelLarge">{p.nombreAnt}</Text>
            <Text variant="headlineSmall">{formatEnergy(tAnt.kwh)}</Text>
            <Text variant="bodyMedium">{formatMoney(tAnt.costo)}</Text>
          </View>
        </View>
        <Cambio ahora={totales(rs, { desde: rango.desde, hasta }).kwh} antes={tAnt.kwh} contra={p.nombreAnt.toLowerCase()} />
        {esActual && <Nota>{`Comparamos del 1 al ${+hoy.slice(8)} de cada mes, para que sea justo.`}</Nota>}
        {proy && (
          <Text variant="bodyMedium">
            {`A este ritmo cerrarás el mes en ${formatEnergy(proy.kwh)}, ${formatMoney(proy.costo)}${
              metaMes !== null ? (proy.kwh > metaMes ? `: ${formatEnergy(proy.kwh - metaMes)} sobre la meta.` : ': dentro de la meta.') : '.'
            }`}
          </Text>
        )}
        {aparatos.length > 0 && (
          <Text variant="bodyMedium">{`Lo que más gastó: ${aparatos.slice(0, 3).map((f) => f.nombre).join(', ')}.`}</Text>
        )}
        <Text variant="labelSmall">Watt'sitcost</Text>
      </Seccion>
      </View>
      <Button mode="outlined" icon="share-variant" onPress={compartir} loading={compartiendo} disabled={compartiendo} contentStyle={{ minHeight: 48 }}>
        Compartir mi resumen
      </Button>

      <Seccion titulo="Semana a semana" ayuda="Toca una semana para ver su detalle.">
        <Columnas columnas={columnas} onPress={(c) => p.onSemana(+c)} />
        <LeyendaColumnas conMeta={hayMeta} />
        {hayMeta && <Nota>La meta de cada semana es la meta de tu periodo repartida por igual entre sus días.</Nota>}
      </Seccion>

      <Seccion titulo={hayMeta ? '¿Vas bien con tu meta?' : 'Cómo se acumula tu consumo'}>
        <Acumulado puntos={puntos} hablado={habladoAcum} />
        <Text variant="bodyMedium">{habladoAcum}</Text>
        {!hayMeta && <Nota>Define tu meta en la pestaña Factura para ver la línea de la meta.</Nota>}
      </Seccion>

      <Seccion titulo="Qué aparato gastó más">
        <Ranking
          filas={aparatos.map((f) => ({
            clave: String(f.aparato_id),
            nombre: f.nombre,
            kwh: f.kwh,
            detalle: formatMoney(f.costo),
            extra: `Usado ${formatDuration(f.horas * 60)}`,
            color: p.color(f.tipo),
          }))}
        />
      </Seccion>

      {tips.length > 0 && (
        <Seccion titulo="Cómo ahorrar" ayuda="Pequeños cambios en los aparatos que más gastan:">
          {tips.map((c) => (
            <View key={c.aparato_id} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }} accessible>
              <Icon source="lightbulb-on-outline" size={24} color={p.color(c.tipo)} />
              <Text variant="bodyMedium" style={{ flex: 1 }}>
                {`Usar ${c.nombre} ${formatDuration(c.menosHoras * 60)} menos cada día que lo usas te ahorraría unos ${formatEnergy(c.kwhMes)}, ${formatMoney(c.pesosMes)} al mes.`}
              </Text>
            </View>
          ))}
          <Nota>Estimado con lo que lo has usado este mes; la nevera no aparece porque se registra sola.</Nota>
        </Seccion>
      )}

      <Seccion titulo="Por tipo de aparato">
        <Dona datos={tipos} costo={t.costo} />
      </Seccion>
    </>
  );
}

function VistaSemana(p: { rs: Registro[]; periodos: PeriodoMeta[]; semana: Rango; hoy: string; color: (tipo: string) => string; onDia: (f: string) => void }) {
  const theme = useTheme();
  const { rs, periodos, semana, hoy } = p;
  const anterior = { desde: sumarDias(semana.desde, -7), hasta: sumarDias(semana.hasta, -7) };
  const t = totales(rs, semana);
  const tAnt = totales(rs, anterior);
  const meta = metaRango(periodos, semana);

  const columnas: Columna[] = porDia(rs, semana).map((d) => {
    const futuro = d.fecha > hoy;
    const m = metaDia(periodos, d.fecha);
    const ds = diaSemana(d.fecha);
    return {
      clave: d.fecha,
      etiqueta: `${LETRAS[ds]}\n${+d.fecha.slice(8)}`,
      kwh: futuro ? null : d.kwh,
      meta: m,
      hablado: `${DIAS[ds]} ${+d.fecha.slice(8)}: ${futuro ? 'aún no llega' : formatEnergy(d.kwh)}${m !== null ? `, meta ${formatEnergy(m)}` : ''}${!futuro && m !== null && d.kwh > m ? ', se pasó de la meta' : ''}. Toca para ver los aparatos.`,
    };
  });

  const ahora = porAparato(rs, semana);
  const antes = porAparato(rs, anterior);
  const ids = [...new Set([...ahora, ...antes].map((f) => f.aparato_id))];
  const diferencias = ids
    .map((id) => {
      const a = ahora.find((f) => f.aparato_id === id);
      const b = antes.find((f) => f.aparato_id === id);
      return { id, nombre: (a ?? b)!.nombre, kwh: a?.kwh ?? 0, dif: (a?.kwh ?? 0) - (b?.kwh ?? 0) };
    })
    .sort((x, y) => Math.abs(y.dif) - Math.abs(x.dif));

  return (
    <>
      <Seccion titulo={`Semana del ${rangoSemana(semana.desde, semana.hasta)}`}>
        <Text variant="headlineSmall">{`${formatEnergy(t.kwh)} · ${formatMoney(t.costo)}`}</Text>
        {meta !== null && (
          <Text variant="bodyMedium">
            {t.kwh > meta ? `Te pasaste ${formatEnergy(t.kwh - meta)} de la meta (${formatEnergy(meta)}).` : `Dentro de la meta de ${formatEnergy(meta)}.`}
          </Text>
        )}
        <Cambio ahora={t.kwh} antes={tAnt.kwh} contra="la semana anterior" />
        {diasEntre(semana.desde, semana.hasta) < 6 && <Nota>Semana incompleta: el mes empieza o termina a mitad de semana.</Nota>}
      </Seccion>

      <Seccion titulo="Día a día" ayuda="Toca un día para ver qué aparatos usaste y cuánto tiempo.">
        <Columnas columnas={columnas} onPress={p.onDia} />
        <LeyendaColumnas conMeta={meta !== null} />
      </Seccion>

      <Seccion titulo="Qué aparato gastó más">
        <Ranking
          filas={ahora.map((f) => ({
            clave: String(f.aparato_id),
            nombre: f.nombre,
            kwh: f.kwh,
            detalle: `Usado ${formatDuration(f.horas * 60)}`,
            extra: formatMoney(f.costo),
            color: p.color(f.tipo),
          }))}
        />
        {!ahora.length && <Text variant="bodyMedium">No hay registros esta semana.</Text>}
      </Seccion>

      <Seccion titulo="Frente a la semana anterior">
        {diferencias.map((d) => {
          const igual = Math.abs(d.dif) < 0.05;
          const sube = d.dif > 0;
          return (
            <View
              key={d.id}
              accessible
              accessibilityLabel={`${d.nombre}: ${formatEnergy(d.kwh)}, ${igual ? 'igual que la semana anterior' : `${formatEnergy(Math.abs(d.dif))} ${sube ? 'más' : 'menos'}`}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 36 }}
            >
              <Text variant="bodyLarge" style={{ flex: 1 }} numberOfLines={1}>
                {d.nombre}
              </Text>
              <Text variant="bodyMedium">{formatEnergy(d.kwh)}</Text>
              <Icon
                source={igual ? 'equal' : sube ? 'arrow-up-bold' : 'arrow-down-bold'}
                size={20}
                color={igual ? theme.colors.onSurface : sube ? theme.colors.tertiary : theme.colors.secondary}
              />
              <Text variant="titleSmall" style={{ minWidth: 72, textAlign: 'right' }}>
                {igual ? 'igual' : `${sube ? '+' : '−'}${formatEnergy(Math.abs(d.dif))}`}
              </Text>
            </View>
          );
        })}
      </Seccion>
    </>
  );
}
