import { addDays, dayKey } from './dates';
import type { AppData } from './types';

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';
export const DAY_PARTS: { key: DayPart; label: string }[] = [
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
  { key: 'night', label: 'Night' },
];

const partOf = (d: Date): DayPart => {
  const h = d.getHours();
  return h >= 4 && h < 12 ? 'morning' : h < 17 && h >= 12 ? 'afternoon' : h >= 17 && h < 22 ? 'evening' : 'night';
};

const ACTION_WINDOW_MS = 15 * 60_000;

export interface Insights {
  days: { key: string; opens: number; done: number }[]; // oldest first
  trackedDays: number; // how many days of the window the log actually covers
  opens: number;
  activeDays: number; // days with at least one open
  byPart: Record<DayPart, number>;
  opensWithAction: number; // opens followed by a completion within 15 minutes
  nudgeOpens: number;
  hearthDone: number; // completed from a Right Now pick
  listDone: number; // completed from the Builds or Habits lists
  postponed: number; // "Not now" taps
  captured: number;
  questsDone: number;
  habitsTended: number;
  fuel: number;
  sparksEarned: number;
  sparksSpent: number;
  drops: number;
}

/** Everything the Insights screen shows, for the last `span` days including today. */
export function insights(data: AppData, now: Date, span: number): Insights {
  const today = dayKey(now);
  const first = addDays(today, -(span - 1));
  const inWindow = (iso: string) => {
    const k = dayKey(new Date(iso));
    return k >= first && k <= today;
  };
  const days = Array.from({ length: span }, (_, i) => ({ key: addDays(first, i), opens: 0, done: 0 }));
  const byKey = new Map(days.map((d) => [d.key, d]));

  const opens = data.events.filter((e) => e.type === 'open' && inWindow(e.at));
  const completions = data.completions.filter((c) => inWindow(c.at));
  const byPart: Record<DayPart, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  let opensWithAction = 0;
  const doneTimes = completions.map((c) => Date.parse(c.at));
  for (const e of opens) {
    byKey.get(dayKey(new Date(e.at)))!.opens++;
    byPart[partOf(new Date(e.at))]++;
    const t = Date.parse(e.at);
    if (doneTimes.some((d) => d >= t && d - t <= ACTION_WINDOW_MS)) opensWithAction++;
  }
  for (const c of completions) byKey.get(dayKey(new Date(c.at)))!.done++;

  const firstEvent = data.events.length ? dayKey(new Date(data.events[0].at)) : today;
  const trackedFrom = firstEvent > first ? firstEvent : first;
  const loot = data.loot.filter((l) => inWindow(l.at));

  return {
    days,
    trackedDays: days.filter((d) => d.key >= trackedFrom).length,
    opens: opens.length,
    activeDays: days.filter((d) => d.opens > 0).length,
    byPart,
    opensWithAction,
    nudgeOpens: opens.filter((e) => e.source === 'nudge').length,
    hearthDone: completions.filter((c) => c.via === 'hearth').length,
    listDone: completions.filter((c) => c.via === 'list').length,
    postponed: data.events.filter((e) => e.type === 'postpone' && inWindow(e.at)).length,
    captured: data.tasks.filter((t) => inWindow(t.createdAt)).length,
    questsDone: completions.filter((c) => c.kind === 'task').length,
    habitsTended: completions.filter((c) => c.kind === 'habit').length,
    fuel: completions.reduce((n, c) => n + c.xp, 0),
    sparksEarned: completions.reduce((n, c) => n + c.sparks, 0) + loot.reduce((n, l) => n + Math.max(0, l.sparksDelta), 0),
    sparksSpent: loot.reduce((n, l) => n + Math.max(0, -l.sparksDelta), 0),
    drops: loot.filter((l) => l.source === 'drop').length,
  };
}
