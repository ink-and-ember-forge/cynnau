import type { AppData, Completion } from './types';
import { levelFor, type LevelInfo } from './xp';

// Stats are observed, never set. Each one reads a different signal from the
// completion log.
export type StatKey = 'courage' | 'stamina' | 'tempo' | 'constancy' | 'grit';

export const STATS: { key: StatKey; name: string; icon: string; blurb: string; points: (c: Completion) => number }[] = [
  { key: 'courage', name: 'Courage', icon: '🦁', blurb: 'Dreaded things faced', points: (c) => (c.dread === 2 ? 3 : c.dread) },
  { key: 'stamina', name: 'Stamina', icon: '⛰️', blurb: 'Long stretches of work', points: (c) => (c.time === 120 ? 3 : c.time === 30 ? 1 : 0) },
  { key: 'tempo', name: 'Tempo', icon: '⚡', blurb: 'Quick wins knocked out', points: (c) => (c.time === 5 ? 1 : 0) },
  { key: 'constancy', name: 'Constancy', icon: '🌿', blurb: 'Habits tended', points: (c) => (c.kind === 'habit' ? 1 : 0) },
  { key: 'grit', name: 'Grit', icon: '🪨', blurb: 'Stubborn quests finally done', points: (c) => c.stubbornDays },
];

export const STAT_STEP = 3;

export function statLevels(data: AppData): { key: StatKey; name: string; icon: string; blurb: string; points: number; info: LevelInfo }[] {
  return STATS.map(({ points, ...s }) => {
    const total = data.completions.reduce((n, c) => n + points(c), 0);
    return { ...s, points: total, info: levelFor(total, STAT_STEP) };
  });
}
