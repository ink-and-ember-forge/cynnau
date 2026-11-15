import { describe, expect, it } from 'vitest';
import { pickQuests, totalFuel } from './rightNow';
import { xpFor } from './xp';
import type { Task } from './types';

const mk = (o: Partial<Task>): Task => ({
  id: Math.random().toString(),
  title: 't',
  time: 5,
  dread: 0,
  skillId: null,
  createdAt: '2026-11-15T00:00:00Z',
  completedAt: null,
  xpAwarded: null,
  ...o,
});
const now = new Date('2026-11-15T12:00:00Z');

describe('pickQuests', () => {
  it('excludes tasks longer than the time available and completed ones', () => {
    const tasks = [mk({ id: 'a', time: 120 }), mk({ id: 'b', time: 5 }), mk({ id: 'c', completedAt: 'x' })];
    expect(pickQuests(tasks, { minutes: 15, energy: 'ok' }, now).map((t) => t.id)).toEqual(['b']);
  });
  it('prefers low-dread tasks when energy is low', () => {
    const tasks = [mk({ id: 'hard', dread: 2 }), mk({ id: 'easy', dread: 0 })];
    expect(pickQuests(tasks, { minutes: 15, energy: 'low' }, now)[0].id).toBe('easy');
  });
  it('prefers high-dread tasks when energy is high', () => {
    const tasks = [mk({ id: 'hard', dread: 2 }), mk({ id: 'easy', dread: 0 })];
    expect(pickQuests(tasks, { minutes: 15, energy: 'high' }, now)[0].id).toBe('hard');
  });
  it('returns at most 3', () => {
    expect(pickQuests(Array.from({ length: 6 }, () => mk({})), { minutes: 30, energy: 'ok' }, now)).toHaveLength(3);
  });
});

describe('xp', () => {
  it('scales modestly with dread', () => {
    expect(xpFor(30, 0)).toBe(40);
    expect(xpFor(30, 2)).toBe(52);
  });
  it('sums fuel', () => {
    expect(totalFuel([mk({ xpAwarded: 10 }), mk({}), mk({ xpAwarded: 40 })])).toBe(50);
  });
});
