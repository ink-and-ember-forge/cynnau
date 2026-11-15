import type { Dread, TimeBucket } from './types';

// Starting numbers, to be tuned in use. XP = base(time) x dread multiplier.
export const BASE_XP: Record<TimeBucket, number> = { 5: 10, 30: 40, 120: 120 };
// Deliberately modest so inflating dread is not worth it.
export const DREAD_MULTIPLIER: Record<Dread, number> = { 0: 1, 1: 1.15, 2: 1.3 };

export function xpFor(time: TimeBucket, dread: Dread): number {
  return Math.round(BASE_XP[time] * DREAD_MULTIPLIER[dread]);
}
