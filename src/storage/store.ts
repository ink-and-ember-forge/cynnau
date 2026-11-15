import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { migrate } from '../domain/migrate';
import { emptyData, type AppData } from '../domain/types';

const KEY = 'cynnau:data:v1'; // storage slot name; the data inside carries its own version

export async function loadData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return emptyData();
    const data = migrate(JSON.parse(raw));
    if (data) return data;
    // Never silently drop data we cannot read: park it where it can be recovered.
    await AsyncStorage.setItem(`${KEY}:unreadable`, raw);
    return emptyData();
  } catch {
    return emptyData();
  }
}

export async function saveData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

/** Writes a JSON backup and opens the share sheet (save to Drive, email, etc). */
export async function exportData(data: AppData): Promise<void> {
  const name = `cynnau-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const json = JSON.stringify(data, null, 2);
  if (Platform.OS === 'web') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = name;
    a.click();
    return;
  }
  const file = new File(Paths.cache, name);
  if (!file.exists) file.create();
  file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export Cynnau data' });
}

/** Lets you pick a backup file. Resolves null if cancelled; throws if the file is not a Cynnau backup. */
export async function importData(): Promise<AppData | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/*', '*/*'], copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  const text = asset.file ? await asset.file.text() : await new File(asset.uri).text();
  const data = migrate(JSON.parse(text));
  if (!data) throw new Error('Not a Cynnau backup');
  return data;
}
