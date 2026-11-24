import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export type Recordatorio = { activo: boolean; hora: number };

const CLAVE = 'ajuste_recordatorio';
const POR_DEFECTO: Recordatorio = { activo: false, hora: 20 };

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
} catch {}

export async function leerRecordatorio(): Promise<Recordatorio> {
  try {
    const raw = await AsyncStorage.getItem(CLAVE);
    if (!raw) return POR_DEFECTO;
    const v = JSON.parse(raw);
    const hora = Number.isInteger(v?.hora) && v.hora >= 0 && v.hora <= 23 ? v.hora : POR_DEFECTO.hora;
    return { activo: v?.activo === true, hora };
  } catch {
    return POR_DEFECTO;
  }
}

/** Devuelve true si el estado quedó como se pidió (false si se negó el permiso o falló). */
export async function programarRecordatorio(r: Recordatorio): Promise<boolean> {
  try {
    if (r.activo) {
      let { granted } = await Notifications.getPermissionsAsync();
      if (!granted) ({ granted } = await Notifications.requestPermissionsAsync());
      if (!granted) {
        await AsyncStorage.setItem(CLAVE, JSON.stringify({ activo: false, hora: r.hora }));
        return false;
      }
      await Notifications.setNotificationChannelAsync('recordatorio', {
        name: 'Recordatorio diario',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: { title: '¿Ya reportaste hoy?', body: 'Toca para anotar lo que usaste y mantener tu racha.' },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: r.hora,
          minute: 0,
          channelId: 'recordatorio',
        },
      });
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    await AsyncStorage.setItem(CLAVE, JSON.stringify(r));
    return true;
  } catch {
    return false;
  }
}
