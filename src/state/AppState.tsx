import * as Haptics from 'expo-haptics';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState as RNAppState, Platform } from 'react-native';
import { logOpen, tagLastCompletion, updateSettings, type Outcome } from '../domain/actions';
import { consumeNudgeTap } from '../notifications';
import { emptyData, type AppData } from '../domain/types';
import { loadData, saveData, writeBackup } from '../storage/store';

export type Tab = 'hearth' | 'builds' | 'habits' | 'character' | 'loot';

export type SheetState =
  | { type: 'task'; id?: string; projectId?: string | null }
  | { type: 'habit'; id?: string }
  | { type: 'build'; id?: string }
  | { type: 'skill'; id?: string }
  | { type: 'reward' }
  | { type: 'insights' }
  | { type: 'settings' };

export interface Toast {
  key: number;
  outcome?: Outcome;
  message?: string;
  undo?: AppData; // snapshot to restore
}

interface Ctx {
  data: AppData;
  loaded: boolean;
  now: Date;
  tab: Tab;
  setTab: (t: Tab) => void;
  sheet: SheetState | null;
  open: (s: SheetState) => void;
  close: () => void;
  /** Apply a pure change to the data and persist it. */
  act: (fn: (d: AppData) => AppData | null) => void;
  /** Apply a completion and show its reward moment (with undo). */
  finish: (fn: (d: AppData) => { data: AppData; outcome: Outcome } | null, via: 'hearth' | 'list') => void;
  /** Write a backup to the chosen folder now. Returns an error message, or null on success. */
  backupNow: () => string | null;
  replaceAll: (d: AppData) => void;
  toast: Toast | null;
  say: (message: string) => void;
  undo: () => void;
  dismissToast: () => void;
}

const C = createContext<Ctx | null>(null);
export const useApp = () => useContext(C)!;

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [tab, setTab] = useState<Tab>('hearth');
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const ref = useRef(data);
  const toastKey = useRef(0);

  const dirty = useRef(false); // changed since the last automatic backup

  const persist = useCallback((next: AppData) => {
    ref.current = next;
    setData(next);
    return saveData(next);
  }, []);

  /** Notes an app open in the private usage log (never marks data as needing backup). */
  const noteOpen = useCallback(() => {
    const next = logOpen(ref.current, new Date(), consumeNudgeTap() ? 'nudge' : undefined);
    if (next) persist(next).catch(() => {});
  }, [persist]);

  const backupNow = useCallback((): string | null => {
    const d = ref.current;
    if (!d.settings.backupDirUri) return 'No backup folder chosen.';
    try {
      const t = new Date();
      const p = (n: number) => String(n).padStart(2, '0');
      const stamp = `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}-${p(t.getHours())}${p(t.getMinutes())}`;
      const next = updateSettings(d, { backupLastAt: t.toISOString() });
      writeBackup(d.settings.backupDirUri, next, stamp);
      dirty.current = false;
      persist(next).catch(() => {});
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'Backup failed.';
    }
  }, [persist]);

  useEffect(() => {
    loadData().then((d) => {
      ref.current = d;
      setData(d);
      setLoaded(true);
      noteOpen();
    });
  }, [noteOpen]);

  // Keep "today" fresh: tick each minute and whenever the app returns to the foreground.
  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = setInterval(tick, 60_000);
    const sub = RNAppState.addEventListener('change', (s) => {
      if (s === 'active') {
        tick();
        noteOpen();
      } else if (s === 'background' && dirty.current && ref.current.settings.backupDirUri) {
        // Leaving the app is the moment the data is most complete, so back up then.
        if (backupNow()) setToast({ key: ++toastKey.current, message: 'Automatic backup failed. Check the folder in Settings.' });
      }
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [noteOpen, backupNow]);

  const say = useCallback((message: string) => setToast({ key: ++toastKey.current, message }), []);

  const commit = useCallback(
    (next: AppData) => {
      dirty.current = true;
      persist(next).catch(() => say('Could not save. Your last change may not persist.'));
    },
    [say, persist],
  );

  const value = useMemo<Ctx>(
    () => ({
      data,
      loaded,
      now,
      tab,
      setTab,
      sheet,
      open: setSheet,
      close: () => setSheet(null),
      act: (fn) => {
        const next = fn(ref.current);
        if (next) commit(next);
      },
      finish: (fn, via) => {
        const before = ref.current;
        const res = fn(before);
        if (!res) return;
        commit(tagLastCompletion(res.data, via));
        setNow(new Date());
        setToast({ key: ++toastKey.current, outcome: res.outcome, undo: before });
        if (Platform.OS !== 'web') {
          const big = res.outcome.levelUp || res.outcome.drop;
          (big ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)).catch(() => {});
        }
      },
      replaceAll: commit,
      backupNow,
      toast,
      say,
      undo: () => {
        if (toast?.undo) commit(toast.undo);
        setToast(null);
      },
      dismissToast: () => setToast(null),
    }),
    [data, loaded, now, tab, sheet, toast, commit, say, backupNow],
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}
