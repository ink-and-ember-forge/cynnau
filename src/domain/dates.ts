// The day rolls over at 04:00 local, so a late night still counts for "today".
const ROLLOVER_HOURS = 4;
export const DAY_MS = 86_400_000;

const shifted = (d: Date) => new Date(d.getTime() - ROLLOVER_HOURS * 3_600_000);
const pad = (n: number) => String(n).padStart(2, '0');

/** Local day key, e.g. "2026-11-15". */
export function dayKey(d: Date): string {
  const s = shifted(d);
  return `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}`;
}

/** Noon of a day key in local time (noon avoids DST edges when adding days). */
export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(key: string, n: number): string {
  const d = keyToDate(key);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Day key of the Monday that starts the week containing `key`. */
export function weekStart(key: string): string {
  const dow = (keyToDate(key).getDay() + 6) % 7; // Mon = 0
  return addDays(key, -dow);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((keyToDate(b).getTime() - keyToDate(a).getTime()) / DAY_MS);
}
