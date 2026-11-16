import { dayKey } from './dates';
import { stubbornDays } from './select';
import { habitDue, habitStreak, type StreakInfo } from './streaks';
import type { AppData, Dread, Energy, Habit, Task } from './types';

export interface RightNowInput {
  minutes: number; // time available
  energy: Energy;
}

export type Quest = { kind: 'task'; id: string; task: Task; stubborn: number } | { kind: 'habit'; id: string; habit: Habit; streak: StreakInfo };

// How well a quest's dread suits current energy (higher is better).
const ENERGY_FIT: Record<Energy, Record<Dread, number>> = {
  low: { 0: 2, 1: 0.5, 2: -2 },
  ok: { 0: 1, 1: 1, 2: 0 },
  high: { 0: 0, 1: 1, 2: 2 },
};

/**
 * Open quests and due habits that fit the time window, best first.
 * Ranking: energy fit, then making good use of the time you have, then a
 * capped nudge for stubborn quests, and a lift for habits (more if at risk).
 */
export function pickQuests(data: AppData, { minutes, energy }: RightNowInput, now: Date = new Date(), limit = 3): Quest[] {
  const today = dayKey(now);
  const scored: { q: Quest; s: number; created: string }[] = [];
  const timeScore = (time: number) => (time / minutes) * 1.5 - (energy === 'low' && time === 120 ? 1.5 : 0);

  for (const task of data.tasks) {
    if (task.completedAt || task.time > minutes) continue;
    if (task.snoozedUntil && task.snoozedUntil > today) continue;
    const stubborn = stubbornDays(task, now);
    const s = ENERGY_FIT[energy][task.dread] + timeScore(task.time) + stubborn * 0.2 + Math.min(task.postponed, 5) * 0.05;
    scored.push({ q: { kind: 'task', id: task.id, task, stubborn }, s, created: task.createdAt });
  }
  for (const habit of data.habits) {
    if (habit.archivedAt || habit.time > minutes) continue;
    const streak = habitStreak(data, habit, now);
    if (!habitDue(streak)) continue;
    const s = ENERGY_FIT[energy][0] + timeScore(habit.time) + 0.75 + (streak.atRisk ? 1.5 : 0);
    scored.push({ q: { kind: 'habit', id: habit.id, habit, streak }, s, created: habit.createdAt });
  }

  scored.sort((a, b) => b.s - a.s || a.created.localeCompare(b.created));
  // Keep at least one slot for a quest so habits never crowd out the builds.
  const out: Quest[] = [];
  const maxHabits = scored.some((x) => x.q.kind === 'task') ? limit - 1 : limit;
  let habits = 0;
  for (const { q } of scored) {
    if (out.length >= limit) break;
    if (q.kind === 'habit' && habits++ >= maxHabits) continue;
    out.push(q);
  }
  return out;
}
