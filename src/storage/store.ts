import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { emptyData, type AppData } from '../domain/types';

const KEY = 'cynnau:data:v1';

export async function loadData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as AppData;
    return parsed.version === 1 && Array.isArray(parsed.tasks) ? parsed : emptyData();
  } catch {
    return emptyData();
  }
}

export async function saveData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

/** Writes a JSON backup and opens the share sheet (save to Drive, email, etc). */
export async function exportData(data: AppData): Promise<void> {
  const stamp = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `cynnau-backup-${stamp}.json`);
  if (!file.exists) file.create();
  file.write(JSON.stringify(data, null, 2));
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export Cynnau data' });
}
