import { describe, expect, it } from 'vitest';
import { addHabit, addProject, addReward, addTask, buyReward, completeTask, deleteProject, logOpen, postponeTask, tagLastCompletion, tendHabit } from './actions';
import { insights } from './insights';
import { addDays, dayKey, weekStart } from './dates';
import { PRICE, dropChance, rollDrop } from './loot';
import { migrate } from './migrate';
import { pickQuests } from './rightNow';
import { characterLevel, skillLevel, sparks, totalXp } from './select';
import { statLevels } from './stats';
import { habitStreak, streakFor } from './streaks';
import { emptyData, type AppData } from './types';
import { levelFor, titleFor, xpFor } from './xp';

const at = (day: number, hour = 12) => new Date(2026, 10, day, hour); // November 2026, local
const now = at(15);
const never = () => 0.99; // rng that never drops loot
const seq = (...xs: number[]) => () => xs.shift() ?? 0.99;
const quest = (d: AppData, title: string, o: Partial<{ time: 5 | 30 | 120; dread: 0 | 1 | 2; projectId: string | null; when: Date }> = {}) =>
  addTask(d, { title, time: o.time ?? 5, dread: o.dread ?? 0, projectId: o.projectId ?? null }, o.when ?? now);
const idOf = (d: AppData, title: string) => d.tasks.find((t) => t.title === title)!.id;

describe('xp and levels', () => {
  it('scales modestly with dread', () => {
    expect(xpFor(30, 0)).toBe(40);
    expect(xpFor(30, 2)).toBe(52);
  });
  it('caps the stubborn bonus', () => {
    expect(xpFor(30, 0, 2)).toBe(44);
    expect(xpFor(30, 0, 5)).toBe(50);
    expect(xpFor(30, 0, 50)).toBe(50);
  });
  it('levels on a triangular curve', () => {
    expect(levelFor(0, 100).level).toBe(1);
    expect(levelFor(99, 100).level).toBe(1);
    expect(levelFor(100, 100).level).toBe(2);
    expect(levelFor(300, 100)).toMatchObject({ level: 3, into: 0, need: 300 });
  });
  it('names levels', () => {
    expect(titleFor(1)).toBe('Spark-Striker');
    expect(titleFor(9)).toBe('Keeper of the Hearth');
  });
});

describe('dates', () => {
  it('rolls the day over at 4am', () => {
    expect(dayKey(at(15, 2))).toBe('2026-11-14');
    expect(dayKey(at(15, 5))).toBe('2026-11-15');
  });
  it('finds Monday', () => {
    expect(weekStart('2026-11-15')).toBe('2026-11-09'); // a Sunday
    expect(weekStart('2026-11-16')).toBe('2026-11-16');
  });
});

describe('pickQuests', () => {
  it('excludes quests longer than the time available, completed and snoozed ones', () => {
    let d = quest(quest(quest(quest(emptyData(), 'long', { time: 120 }), 'short'), 'done'), 'later');
    d = completeTask(d, idOf(d, 'done'), now, never)!.data;
    d = postponeTask(d, idOf(d, 'later'), now);
    expect(pickQuests(d, { minutes: 15, energy: 'ok' }, now).map((q) => q.kind === 'task' && q.task.title)).toEqual(['short']);
    expect(pickQuests(d, { minutes: 15, energy: 'ok' }, at(16)).length).toBe(2); // snooze ends tomorrow
  });
  it('matches dread to energy', () => {
    const d = quest(quest(emptyData(), 'hard', { dread: 2 }), 'easy');
    const first = (energy: 'low' | 'high') => pickQuests(d, { minutes: 15, energy }, now)[0];
    expect(first('low')).toMatchObject({ task: { title: 'easy' } });
    expect(first('high')).toMatchObject({ task: { title: 'hard' } });
  });
  it('returns at most 3 and keeps a slot for a quest when habits are due', () => {
    let d = emptyData();
    for (let i = 0; i < 5; i++) d = addHabit(d, { title: `h${i}`, time: 5, rhythm: { kind: 'daily' }, skillId: null }, now);
    d = quest(d, 'q');
    const picked = pickQuests(d, { minutes: 30, energy: 'ok' }, now);
    expect(picked).toHaveLength(3);
    expect(picked.filter((q) => q.kind === 'task')).toHaveLength(1);
  });
  it('drops a habit once tended today', () => {
    let d = addHabit(emptyData(), { title: 'h', time: 5, rhythm: { kind: 'daily' }, skillId: null }, now);
    expect(pickQuests(d, { minutes: 30, energy: 'ok' }, now)).toHaveLength(1);
    d = tendHabit(d, d.habits[0].id, now, never)!.data;
    expect(pickQuests(d, { minutes: 30, energy: 'ok' }, now)).toHaveLength(0);
    expect(tendHabit(d, d.habits[0].id, now, never)).toBeNull();
  });
});

describe('completing', () => {
  it('awards fuel and sparks, and levels the inherited skill', () => {
    let d = addProject(emptyData(), { name: 'Shed', skillId: 'skill-home' }, now);
    d = quest(d, 'frame', { time: 120, projectId: d.projects[0].id });
    const res = completeTask(d, idOf(d, 'frame'), now, never)!;
    expect(res.outcome).toMatchObject({ xp: 120, sparks: 12, levelUp: true, level: 2, drop: null });
    expect(res.outcome.skill).toMatchObject({ name: 'Home', level: 2, levelUp: true });
    expect(totalXp(res.data)).toBe(120);
    expect(skillLevel(res.data, 'skill-home').level).toBe(2);
    expect(completeTask(res.data, idOf(d, 'frame'), now, never)).toBeNull();
  });
  it('pays a capped bonus for a rolled-over quest and feeds grit', () => {
    const d = quest(emptyData(), 'old', { time: 30, when: at(1) });
    const res = completeTask(d, idOf(d, 'old'), now, never)!;
    expect(res.outcome).toMatchObject({ xp: 50, stubbornDays: 5 });
    expect(statLevels(res.data).find((s) => s.key === 'grit')!.points).toBe(5);
  });
  it('keeps quests when a build is deleted', () => {
    let d = addProject(emptyData(), { name: 'P', skillId: null }, now);
    d = deleteProject(quest(d, 'q', { projectId: d.projects[0].id }), d.projects[0].id);
    expect(d.tasks[0].projectId).toBeNull();
  });
});

describe('streaks', () => {
  const daily = { kind: 'daily' } as const;
  const days = (...offsets: number[]) => offsets.map((o) => addDays('2026-11-01', o));
  it('counts consecutive days', () => {
    expect(streakFor(daily, '2026-11-01', days(0, 1, 2), '2026-11-03')).toMatchObject({ streak: 3, atRisk: false, doneToday: true });
  });
  it('holds through one missed day, flagged at risk', () => {
    expect(streakFor(daily, '2026-11-01', days(0, 1, 2, 3), '2026-11-06')).toMatchObject({ streak: 4, atRisk: true, dipped: false });
  });
  it('recovers fully after a single miss', () => {
    expect(streakFor(daily, '2026-11-01', days(0, 1, 2, 3, 5), '2026-11-06')).toMatchObject({ streak: 5, atRisk: false });
  });
  it('dips rather than resets on a second miss', () => {
    expect(streakFor(daily, '2026-11-01', days(0, 1, 2, 3), '2026-11-07')).toMatchObject({ streak: 2, dipped: true });
    expect(streakFor(daily, '2026-11-01', days(0, 1, 2, 3), '2026-11-08')).toMatchObject({ streak: 1 });
  });
  it('handles N× a week', () => {
    const r = { kind: 'weekly', times: 2 } as const;
    // Weeks start Mon 2 Nov, 9 Nov, 16 Nov.
    const done = ['2026-11-02', '2026-11-04', '2026-11-10', '2026-11-12', '2026-11-16'];
    expect(streakFor(r, '2026-11-02', done, '2026-11-17')).toMatchObject({ streak: 2, count: 1, target: 2, atRisk: false });
    expect(streakFor(r, '2026-11-02', [...done, '2026-11-17'], '2026-11-17')).toMatchObject({ streak: 3, doneToday: true });
  });
  it('reports the streak after tending', () => {
    let d = addHabit(emptyData(), { title: 'h', time: 5, rhythm: daily, skillId: null }, at(14));
    d = tendHabit(d, d.habits[0].id, at(14), never)!.data;
    const res = tendHabit(d, d.habits[0].id, at(15), never)!;
    expect(res.outcome.streak).toBe(2);
    expect(habitStreak(res.data, res.data.habits[0], at(15)).streak).toBe(2);
  });
});

describe('loot', () => {
  it('keeps drops occasional', () => {
    expect(dropChance({ dread: 0, stubbornDays: 0, streak: 0 })).toBeCloseTo(0.06);
    expect(dropChance({ dread: 2, stubbornDays: 5, streak: 30 })).toBe(0.15);
  });
  it('drops a defined reward, or a pouch of sparks when none fits', () => {
    const d = addReward(addReward(emptyData(), { name: 'Coffee out', tier: 'small' }, now), { name: 'New boots', tier: 'big' }, now);
    expect(rollDrop(d.rewards, 0.1, now, 'c', seq(0.5))).toBeNull();
    expect(rollDrop(d.rewards, 0.1, now, 'c', seq(0.01, 0.9, 0))).toMatchObject({ name: 'Coffee out', redeemedAt: null });
    expect(rollDrop(d.rewards, 0.1, now, 'c', seq(0.01, 0.01, 0))).toMatchObject({ name: 'New boots', tier: 'big' });
    expect(rollDrop(d.rewards.slice(1), 0.1, now, 'c', seq(0.01, 0.9, 0))).toMatchObject({ rewardId: null, sparksDelta: 5 });
  });
  it('adds a dropped pouch to the spark balance and lets you buy', () => {
    let d = quest(emptyData(), 'q', { time: 120 });
    d = completeTask(d, idOf(d, 'q'), now, seq(0.01, 0.9, 0.99))!.data; // 12 sparks + pouch of 20
    expect(sparks(d)).toBe(32);
    d = addReward(d, { name: 'Coffee out', tier: 'small' }, now);
    expect(buyReward(addReward(d, { name: 'Trip', tier: 'big' }, now), d.rewards[0].id)).not.toBeNull();
    const bought = buyReward(d, d.rewards[0].id, now)!;
    expect(sparks(bought)).toBe(32 - PRICE.small);
    expect(buyReward(bought, d.rewards[0].id, now)).toBeNull();
  });
});

describe('migrate', () => {
  it('upgrades v1 data and keeps earned fuel', () => {
    const v1 = {
      version: 1,
      tasks: [
        { id: 'a', title: 'done', time: 30, dread: 0, skillId: null, createdAt: now.toISOString(), completedAt: now.toISOString(), xpAwarded: 40 },
        { id: 'b', title: 'open', time: 5, dread: 1, skillId: null, createdAt: now.toISOString(), completedAt: null, xpAwarded: null },
      ],
    };
    const d = migrate(v1)!;
    expect(d.version).toBe(2);
    expect(totalXp(d)).toBe(40);
    expect(d.tasks[1]).toMatchObject({ projectId: null, postponed: 0 });
    expect(d.skills.length).toBeGreaterThan(0);
    expect(characterLevel(d).level).toBe(1);
  });
  it('round-trips v2 and rejects junk', () => {
    const d = quest(emptyData(), 'q');
    expect(migrate(JSON.parse(JSON.stringify(d)))).toEqual(d);
    expect(migrate({ hello: 1 })).toBeNull();
    expect(migrate(null)).toBeNull();
  });
});

describe('usage log and insights', () => {
  it('counts a quick return as the same visit', () => {
    const d = logOpen(emptyData(), at(15, 9))!;
    expect(logOpen(d, new Date(at(15, 9).getTime() + 60_000))).toBeNull();
    expect(logOpen(d, at(15, 10))!.events).toHaveLength(2);
  });
  it('summarises opens, actions and picks over the window', () => {
    let d = quest(quest(emptyData(), 'a', { when: at(14) }), 'b', { when: at(14) });
    d = logOpen(d, at(14, 8), 'nudge')!; // opened, did nothing
    d = logOpen(d, at(15, 18))!;
    d = tagLastCompletion(completeTask(d, idOf(d, 'a'), new Date(at(15, 18).getTime() + 120_000), never)!.data, 'hearth');
    d = postponeTask(d, idOf(d, 'b'), at(15, 18));
    const i = insights(d, at(15, 20), 7);
    expect(i).toMatchObject({ opens: 2, activeDays: 2, trackedDays: 2, opensWithAction: 1, nudgeOpens: 1, hearthDone: 1, listDone: 0, postponed: 1, captured: 2, questsDone: 1, fuel: 10 });
    expect(i.byPart).toEqual({ morning: 1, afternoon: 0, evening: 1, night: 0 });
    expect(i.days).toHaveLength(7);
    expect(i.days[6]).toMatchObject({ key: '2026-11-15', opens: 1, done: 1 });
  });
  it('ignores activity outside the window', () => {
    const d = logOpen(emptyData(), at(1, 9))!;
    expect(insights(d, at(15), 7)).toMatchObject({ opens: 0, trackedDays: 7 });
  });
});
