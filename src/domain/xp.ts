import type { Dread, TimeBucket } from './types';

// Starting numbers, to be tuned in use. XP = base(time) x dread multiplier.
export const BASE_XP: Record<TimeBucket, number> = { 5: 10, 30: 40, 120: 120 };
// Deliberately modest so inflating dread is not worth it.
export const DREAD_MULTIPLIER: Record<Dread, number> = { 0: 1, 1: 1.15, 2: 1.3 };
// "Stubborn task" bonus: +5% per day rolled over after the first, capped so
// the app never pays you to procrastinate.
export const STUBBORN_PER_DAY = 0.05;
export const STUBBORN_CAP_DAYS = 5;

export function xpFor(time: TimeBucket, dread: Dread, stubbornDays = 0): number {
  const stubborn = 1 + Math.min(Math.max(stubbornDays, 0), STUBBORN_CAP_DAYS) * STUBBORN_PER_DAY;
  return Math.round(BASE_XP[time] * DREAD_MULTIPLIER[dread] * stubborn);
}

/** Sparks (shop currency) trickle in at a tenth of fuel. */
export const sparksFor = (xp: number) => Math.max(1, Math.round(xp / 10));

export interface LevelInfo {
  level: number;
  into: number; // points earned inside this level
  need: number; // points this level takes
  progress: number; // 0..1
}

/** Triangular curve: going from level L to L+1 costs `step * L` points. */
export function levelFor(points: number, step: number): LevelInfo {
  let level = 1;
  let left = Math.max(0, points);
  while (left >= step * level) {
    left -= step * level;
    level++;
  }
  const need = step * level;
  return { level, into: left, need, progress: left / need };
}

export const CHARACTER_STEP = 100;
export const SKILL_STEP = 60;

// Identity titles: character growth carries the builder/keeper identity.
export const TITLES: [number, string][] = [
  [1, 'Spark-Striker'],
  [3, 'Kindler'],
  [5, 'Tender of Flames'],
  [8, 'Keeper of the Hearth'],
  [12, 'Builder of Halls'],
  [16, 'Warden of the Fire'],
  [20, 'Master Kindler'],
  [26, 'Hearthlord'],
];

export function titleFor(level: number): string {
  let t = TITLES[0][1];
  for (const [lv, name] of TITLES) if (level >= lv) t = name;
  return t;
}

export function nextTitle(level: number): { level: number; title: string } | null {
  const n = TITLES.find(([lv]) => lv > level);
  return n ? { level: n[0], title: n[1] } : null;
}
