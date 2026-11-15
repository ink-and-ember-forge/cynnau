import type { Dread, Energy, Task } from './types';

export interface RightNowInput {
  minutes: number; // time available
  energy: Energy;
}

const DAY = 86_400_000;

// How well a task's dread suits current energy (higher is better).
const ENERGY_FIT: Record<Energy, Record<Dread, number>> = {
  low: { 0: 2, 1: 0.5, 2: -2 },
  ok: { 0: 1, 1: 1, 2: 0 },
  high: { 0: 0, 1: 1, 2: 2 },
};

/** Tasks that fit the time window, best first. Max `limit` results. */
export function pickQuests(
  tasks: Task[],
  { minutes, energy }: RightNowInput,
  now: Date = new Date(),
  limit = 3,
): Task[] {
  const open = tasks.filter((t) => !t.completedAt && t.time <= minutes);
  const score = (t: Task) => {
    const useOfTime = t.time / minutes; // prefer using the time you have
    const age = Math.min((now.getTime() - Date.parse(t.createdAt)) / DAY, 7);
    const stubborn = Math.min(age, 7) * 0.15; // capped so procrastination isn't rewarded much
    return ENERGY_FIT[energy][t.dread] + useOfTime * 1.5 + stubborn;
  };
  return open
    .map((t) => ({ t, s: score(t) }))
    .sort((a, b) => b.s - a.s || a.t.createdAt.localeCompare(b.t.createdAt))
    .slice(0, limit)
    .map((x) => x.t);
}

export function totalFuel(tasks: Task[]): number {
  return tasks.reduce((n, t) => n + (t.xpAwarded ?? 0), 0);
}
