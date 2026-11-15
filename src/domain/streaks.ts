import { addDays, dayKey, daysBetween, weekStart } from './dates';
import type { AppData, Habit, Rhythm } from './types';

export interface StreakInfo {
  streak: number; // in days (daily) or weeks (weekly)
  best: number;
  atRisk: boolean; // one period already missed: "never miss twice"
  dipped: boolean; // the streak was halved by the most recent miss
  count: number; // times done in the current period
  target: number; // times needed in the current period
  doneToday: boolean;
}

/**
 * Forgiving streaks. A period is a day (daily) or a Mon–Sun week (N× a week).
 * - Missing one period costs nothing: the streak holds, flagged "at risk".
 * - Each further consecutive miss halves the streak rather than resetting it.
 */
export function streakFor(rhythm: Rhythm, startKey: string, doneKeys: string[], todayKey: string): StreakInfo {
  const done = new Set(doneKeys);
  const weekly = rhythm.kind === 'weekly';
  const target = weekly ? rhythm.times : 1;
  const span = weekly ? 7 : 1;
  const first = weekly ? weekStart(startKey) : startKey;
  const current = weekly ? weekStart(todayKey) : todayKey;

  const countIn = (periodStart: string) => {
    let n = 0;
    for (let i = 0; i < span; i++) if (done.has(addDays(periodStart, i))) n++;
    return n;
  };

  let streak = 0;
  let best = 0;
  let misses = 0;
  let dipped = false;
  const periods = Math.max(0, Math.round(daysBetween(first, current) / span));
  for (let p = 0; p < periods; p++) {
    if (countIn(addDays(first, p * span)) >= target) {
      streak++;
      misses = 0;
      dipped = false;
    } else {
      misses++;
      if (misses >= 2 && streak > 0) {
        streak = Math.floor(streak / 2);
        dipped = true;
      }
    }
    best = Math.max(best, streak);
  }
  const count = countIn(current);
  const met = count >= target;
  if (met) {
    streak++;
    dipped = false;
    best = Math.max(best, streak);
  }
  return { streak, best, atRisk: !met && streak > 0 && misses >= 1, dipped: dipped && !met, count, target, doneToday: done.has(todayKey) };
}

export function habitStreak(data: AppData, habit: Habit, now: Date): StreakInfo {
  const keys = data.completions.filter((c) => c.kind === 'habit' && c.refId === habit.id).map((c) => dayKey(new Date(c.at)));
  return streakFor(habit.rhythm, dayKey(new Date(habit.createdAt)), keys, dayKey(now));
}

/** Is this habit still asking for attention today? */
export function habitDue(info: StreakInfo): boolean {
  return !info.doneToday && info.count < info.target;
}

/** The hearth itself: days on which anything at all was done. */
export function hearthStreak(data: AppData, now: Date): StreakInfo {
  const keys = data.completions.map((c) => dayKey(new Date(c.at)));
  const start = keys.length ? keys.reduce((a, b) => (a < b ? a : b)) : dayKey(now);
  return streakFor({ kind: 'daily' }, start, keys, dayKey(now));
}

export const rhythmLabel = (r: Rhythm) => (r.kind === 'daily' ? 'Daily' : `${r.times}× a week`);
