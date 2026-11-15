import { dayKey, daysBetween } from './dates';
import type { AppData, Task } from './types';
import { CHARACTER_STEP, SKILL_STEP, STUBBORN_CAP_DAYS, levelFor } from './xp';

export const totalXp = (d: AppData) => d.completions.reduce((n, c) => n + c.xp, 0);
export const skillXp = (d: AppData, skillId: string) => d.completions.reduce((n, c) => n + (c.skillId === skillId ? c.xp : 0), 0);
export const characterLevel = (d: AppData) => levelFor(totalXp(d), CHARACTER_STEP);
export const skillLevel = (d: AppData, skillId: string) => levelFor(skillXp(d, skillId), SKILL_STEP);

export const sparks = (d: AppData) => d.completions.reduce((n, c) => n + c.sparks, 0) + d.loot.reduce((n, l) => n + l.sparksDelta, 0);

/** A quest's skill is inherited from its Build, never asked for. */
export function taskSkillId(d: AppData, t: Task): string | null {
  return d.projects.find((p) => p.id === t.projectId)?.skillId ?? null;
}

/** Days a task has rolled over: the first day is free, then capped. */
export function stubbornDays(t: Task, now: Date): number {
  const age = daysBetween(dayKey(new Date(t.createdAt)), dayKey(now));
  return Math.max(0, Math.min(age - 1, STUBBORN_CAP_DAYS));
}
