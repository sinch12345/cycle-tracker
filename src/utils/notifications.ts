import { Alert, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { addDays, parseISO } from './date';

// expo-notifications is loaded lazily so the app still runs in Expo Go,
// where the native module may be missing. In a real build it works fully.
let mod: any = null;
let tried = false;

function getNotifications(): any | null {
  if (tried) return mod;
  tried = true;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null;
  try {
    mod = require('expo-notifications');
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.warn('Notifications are not available in this environment');
    mod = null;
  }
  return mod;
}

export async function ensurePermission(): Promise<boolean> {
  const N = getNotifications();
  if (!N) {
    Alert.alert(
      'Reminders unavailable here',
      'Notifications are not supported inside Expo Go. Your choice is saved, and reminders will work in the installed app.'
    );
    return true;
  }
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('default', {
      name: 'Reminders',
      importance: N.AndroidImportance.DEFAULT,
    });
  }
  const current = await N.getPermissionsAsync();
  if (current.granted) return true;
  const req = await N.requestPermissionsAsync();
  return req.granted;
}

export async function cancelReminders() {
  const N = getNotifications();
  if (!N) return;
  await N.cancelAllScheduledNotificationsAsync();
}

export async function scheduleReminders(nextPeriodStart: string | null) {
  const N = getNotifications();
  if (!N) return;
  await N.cancelAllScheduledNotificationsAsync();
  if (!nextPeriodStart) return;

  const items = [
    { offset: -2, title: 'Period coming soon', body: 'Your period is expected in about 2 days.' },
    { offset: 0, title: 'Period expected today', body: 'Your period may start today. Tap to log it.' },
  ];

  const now = Date.now();
  for (const it of items) {
    const when = parseISO(addDays(nextPeriodStart, it.offset));
    when.setHours(9, 0, 0, 0);
    if (when.getTime() <= now) continue;
    await N.scheduleNotificationAsync({
      content: { title: it.title, body: it.body },
      trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: when },
    });
  }
}

