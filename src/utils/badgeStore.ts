import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'cycle-tracker:badges:v1';

export async function getSeenBadges(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function markBadgesSeen(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(ids));
  } catch {}
}

export async function clearBadgeState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}
