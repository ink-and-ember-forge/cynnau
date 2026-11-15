import { addDays, dayKey } from './dates';
import { PRICE, dropChance, rollDrop } from './loot';
import { characterLevel, skillLevel, sparks, stubbornDays, taskSkillId } from './select';
import { habitStreak } from './streaks';
import type { AppData, Completion, Dread, Habit, LootItem, Project, Reward, Rhythm, Settings, Skill, Task, Tier, TimeBucket } from './types';
import { newId } from './types';
import { sparksFor, titleFor, xpFor } from './xp';

/** What the reward moment shows after something is done. */
export interface Outcome {
  title: string;
  xp: number;
  sparks: number;
  stubbornDays: number;
  level: number;
  levelUp: boolean;
  newTitle: string | null;
  skill: { name: string; icon: string; level: number; levelUp: boolean } | null;
  streak: number | null;
  drop: LootItem | null;
}

type Rng = () => number;

function record(data: AppData, c: Completion, title: string, streakBefore: number | null, now: Date, rng: Rng): { data: AppData; outcome: Outcome } {
  const before = characterLevel(data).level;
  const skill = data.skills.find((s) => s.id === c.skillId) ?? null;
  const skillBefore = skill ? skillLevel(data, skill.id).level : 0;
  const drop = rollDrop(data.rewards, dropChance({ dread: c.dread, stubbornDays: c.stubbornDays, streak: streakBefore ?? 0 }), now, c.id, rng);
  const next: AppData = { ...data, completions: [...data.completions, c], loot: drop ? [drop, ...data.loot] : data.loot };
  const after = characterLevel(next).level;
  const skillAfter = skill ? skillLevel(next, skill.id).level : 0;
  return {
    data: next,
    outcome: {
      title,
      xp: c.xp,
      sparks: c.sparks,
      stubbornDays: c.stubbornDays,
      level: after,
      levelUp: after > before,
      newTitle: titleFor(after) !== titleFor(before) ? titleFor(after) : null,
      skill: skill ? { name: skill.name, icon: skill.icon, level: skillAfter, levelUp: skillAfter > skillBefore } : null,
      streak: null,
      drop,
    },
  };
}

// ── Quests ────────────────────────────────────────────────────────────────
export function addTask(data: AppData, f: { title: string; time: TimeBucket; dread: Dread; projectId: string | null }, now = new Date()): AppData {
  const task: Task = { id: newId(), ...f, createdAt: now.toISOString(), completedAt: null, xpAwarded: null, postponed: 0, snoozedUntil: null };
  return { ...data, tasks: [task, ...data.tasks] };
}

export const updateTask = (data: AppData, id: string, patch: Partial<Pick<Task, 'title' | 'time' | 'dread' | 'projectId'>>): AppData => ({
  ...data,
  tasks: data.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
});

export const deleteTask = (data: AppData, id: string): AppData => ({ ...data, tasks: data.tasks.filter((t) => t.id !== id) });

export function completeTask(data: AppData, id: string, now = new Date(), rng: Rng = Math.random): { data: AppData; outcome: Outcome } | null {
  const task = data.tasks.find((t) => t.id === id);
  if (!task || task.completedAt) return null;
  const stubborn = stubbornDays(task, now);
  const xp = xpFor(task.time, task.dread, stubborn);
  const c: Completion = {
    id: newId(),
    kind: 'task',
    refId: task.id,
    at: now.toISOString(),
    xp,
    sparks: sparksFor(xp),
    skillId: taskSkillId(data, task),
    time: task.time,
    dread: task.dread,
    stubbornDays: stubborn,
  };
  const withTask = { ...data, tasks: data.tasks.map((t) => (t.id === id ? { ...t, completedAt: now.toISOString(), xpAwarded: xp } : t)) };
  return record(withTask, c, task.title, null, now, rng);
}

/** "Not now": hides the quest until tomorrow and counts the postponement. */
export const postponeTask = (data: AppData, id: string, now = new Date()): AppData => ({
  ...data,
  tasks: data.tasks.map((t) => (t.id === id ? { ...t, postponed: t.postponed + 1, snoozedUntil: addDays(dayKey(now), 1) } : t)),
});

// ── Builds ────────────────────────────────────────────────────────────────
export function addProject(data: AppData, f: { name: string; skillId: string | null }, now = new Date()): AppData {
  const p: Project = { id: newId(), ...f, createdAt: now.toISOString(), completedAt: null };
  return { ...data, projects: [...data.projects, p] };
}

export const updateProject = (data: AppData, id: string, patch: Partial<Pick<Project, 'name' | 'skillId' | 'completedAt'>>): AppData => ({
  ...data,
  projects: data.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
});

/** Deleting a build keeps its quests, as loose quests. */
export const deleteProject = (data: AppData, id: string): AppData => ({
  ...data,
  projects: data.projects.filter((p) => p.id !== id),
  tasks: data.tasks.map((t) => (t.projectId === id ? { ...t, projectId: null } : t)),
});

// ── Habits ────────────────────────────────────────────────────────────────
export function addHabit(data: AppData, f: { title: string; time: TimeBucket; rhythm: Rhythm; skillId: string | null }, now = new Date()): AppData {
  const h: Habit = { id: newId(), ...f, createdAt: now.toISOString(), archivedAt: null };
  return { ...data, habits: [...data.habits, h] };
}

export const updateHabit = (data: AppData, id: string, patch: Partial<Pick<Habit, 'title' | 'time' | 'rhythm' | 'skillId' | 'archivedAt'>>): AppData => ({
  ...data,
  habits: data.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
});

export function tendHabit(data: AppData, id: string, now = new Date(), rng: Rng = Math.random): { data: AppData; outcome: Outcome } | null {
  const habit = data.habits.find((h) => h.id === id);
  if (!habit || habit.archivedAt) return null;
  const before = habitStreak(data, habit, now);
  if (before.doneToday) return null;
  const xp = xpFor(habit.time, 0);
  const c: Completion = { id: newId(), kind: 'habit', refId: habit.id, at: now.toISOString(), xp, sparks: sparksFor(xp), skillId: habit.skillId, time: habit.time, dread: 0, stubbornDays: 0 };
  const res = record(data, c, habit.title, before.streak, now, rng);
  res.outcome.streak = habitStreak(res.data, habit, now).streak;
  return res;
}

// ── Skills ────────────────────────────────────────────────────────────────
export function addSkill(data: AppData, f: { name: string; icon: string }, now = new Date()): AppData {
  const s: Skill = { id: newId(), ...f, createdAt: now.toISOString() };
  return { ...data, skills: [...data.skills, s] };
}

export const updateSkill = (data: AppData, id: string, patch: Partial<Pick<Skill, 'name' | 'icon'>>): AppData => ({
  ...data,
  skills: data.skills.map((s) => (s.id === id ? { ...s, ...patch } : s)),
});

/** Deleting a skill unlinks it everywhere; fuel already earned stays on the character. */
export const deleteSkill = (data: AppData, id: string): AppData => ({
  ...data,
  skills: data.skills.filter((s) => s.id !== id),
  projects: data.projects.map((p) => (p.skillId === id ? { ...p, skillId: null } : p)),
  habits: data.habits.map((h) => (h.skillId === id ? { ...h, skillId: null } : h)),
  completions: data.completions.map((c) => (c.skillId === id ? { ...c, skillId: null } : c)),
});

// ── Loot ──────────────────────────────────────────────────────────────────
export function addReward(data: AppData, f: { name: string; tier: Tier }, now = new Date()): AppData {
  const r: Reward = { id: newId(), ...f, createdAt: now.toISOString(), archivedAt: null };
  return { ...data, rewards: [...data.rewards, r] };
}

export const removeReward = (data: AppData, id: string, now = new Date()): AppData => ({
  ...data,
  rewards: data.rewards.map((r) => (r.id === id ? { ...r, archivedAt: now.toISOString() } : r)),
});

export function buyReward(data: AppData, id: string, now = new Date()): AppData | null {
  const r = data.rewards.find((x) => x.id === id && !x.archivedAt);
  if (!r || sparks(data) < PRICE[r.tier]) return null;
  const item: LootItem = { id: newId(), rewardId: r.id, name: r.name, tier: r.tier, source: 'bought', sparksDelta: -PRICE[r.tier], at: now.toISOString(), redeemedAt: null, completionId: null };
  return { ...data, loot: [item, ...data.loot] };
}

export const redeemLoot = (data: AppData, id: string, now = new Date()): AppData => ({
  ...data,
  loot: data.loot.map((l) => (l.id === id && !l.redeemedAt ? { ...l, redeemedAt: now.toISOString() } : l)),
});

export const updateSettings = (data: AppData, patch: Partial<Settings>): AppData => ({ ...data, settings: { ...data.settings, ...patch } });
