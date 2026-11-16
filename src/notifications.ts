import { Platform } from 'react-native';

// At most one gentle, optional evening prompt. Nothing else ever notifies.
const CHANNEL = 'evening-nudge';
const ID = 'cynnau-evening-nudge';

const lib = () => require('expo-notifications') as typeof import('expo-notifications');

/** Applies the nudge setting. Returns false if it was wanted but permission was refused. */
export async function syncNudge(enabled: boolean, hour: number): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const N = lib();
  await N.cancelAllScheduledNotificationsAsync();
  if (!enabled) return true;

  let perm = await N.getPermissionsAsync();
  if (!perm.granted) perm = await N.requestPermissionsAsync();
  if (!perm.granted) return false;

  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync(CHANNEL, { name: 'Evening nudge', importance: N.AndroidImportance.DEFAULT, sound: null });
  }
  await N.scheduleNotificationAsync({
    identifier: ID,
    content: { title: 'The hearth is still warm', body: 'Got five minutes? One small quest keeps the fire in.' },
    trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour, minute: 0, channelId: CHANNEL },
  });
  return true;
}

/** True once if the app was just opened by tapping the evening nudge. */
export function consumeNudgeTap(): boolean {
  if (Platform.OS === 'web') return false;
  try {
    const N = lib();
    const last = N.getLastNotificationResponse();
    if (!last) return false;
    N.clearLastNotificationResponse();
    return last.notification.request.identifier === ID;
  } catch {
    return false;
  }
}
