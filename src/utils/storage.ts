import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, DEFAULT_SETTINGS, EMPTY_DATA } from '../types';

const KEY = 'cycle-tracker:data:v1';

export async function loadData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return EMPTY_DATA;
    const parsed = JSON.parse(raw);
    return {
      periods: parsed.periods ?? [],
      logs: parsed.logs ?? {},
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    };
  } catch (e) {
    console.warn('Failed to load data', e);
    return EMPTY_DATA;
  }
}

export async function saveData(data: AppData): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save data', e);
  }
}

export async function clearData(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
