import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
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

// ── Automatic backup ────────────────────────────────────────────────────────
// You pick a folder once (it can be a Google Drive folder). Cynnau then keeps
// a dated backup there, one file per day, the newest KEEP of them.
const PREFIX = 'cynnau-backup-';
const KEEP = 7;

export const autoBackupSupported = Platform.OS === 'android';

/** Asks for a folder. Resolves its URI, or null if cancelled. */
export async function pickBackupFolder(): Promise<{ uri: string; name: string } | null> {
  try {
    const dir = await Directory.pickDirectoryAsync();
    return dir?.uri ? { uri: dir.uri, name: dir.name } : null;
  } catch {
    return null;
  }
}

export function backupFolderName(uri: string): string {
  try {
    return new Directory(uri).name || 'chosen folder';
  } catch {
    return 'chosen folder';
  }
}

/**
 * Writes a backup into the folder, then tidies: one file per day (the newest),
 * for the last KEEP days. `stamp` is "YYYY-MM-DD-HHMM". Throws on failure.
 */
export function writeBackup(dirUri: string, data: AppData, stamp: string): void {
  const dir = new Directory(dirUri);
  // Write first and tidy after, so a failure never leaves the folder without a backup.
  dir.createFile(`${PREFIX}${stamp}.json`, 'application/json').write(JSON.stringify(data));
  const mine = dir
    .list()
    .filter((f): f is File => f instanceof File && f.name.startsWith(PREFIX) && f.name.endsWith('.json'))
    .sort((a, b) => b.name.localeCompare(a.name)); // newest first
  const daysKept = new Set<string>();
  for (const f of mine) {
    const day = f.name.slice(PREFIX.length, PREFIX.length + 10);
    if (daysKept.has(day) || daysKept.size >= KEEP) {
      try {
        f.delete();
      } catch {
        // Tidying is best-effort; the fresh backup is already written.
      }
    } else daysKept.add(day);
  }
}
