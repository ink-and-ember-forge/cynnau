import { defaultSettings, emptyData, seedSkills, type AppData, type Completion, type Task } from './types';
import { sparksFor } from './xp';

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Accepts stored or imported data of any known version. Returns null if unrecognisable. */
export function migrate(raw: unknown): AppData | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.tasks)) return null;

  if (r.version === 1) {
    // v1 had tasks only. Rebuild the completion log from finished tasks.
    const tasks: Task[] = arr<Record<string, any>>(r.tasks).map((t) => ({
      id: String(t.id),
      title: String(t.title ?? ''),
      time: t.time,
      dread: t.dread,
      projectId: null,
      createdAt: t.createdAt,
      completedAt: t.completedAt ?? null,
      xpAwarded: t.xpAwarded ?? null,
      postponed: 0,
      snoozedUntil: null,
    }));
    const completions: Completion[] = tasks
      .filter((t) => t.completedAt)
      .map((t) => ({
        id: `c-${t.id}`,
        kind: 'task',
        refId: t.id,
        at: t.completedAt!,
        xp: t.xpAwarded ?? 0,
        sparks: sparksFor(t.xpAwarded ?? 0),
        skillId: null,
        time: t.time,
        dread: t.dread,
        stubbornDays: 0,
      }));
    return { ...emptyData(), tasks, completions };
  }

  if (r.version === 2) {
    return {
      version: 2,
      tasks: arr(r.tasks),
      projects: arr(r.projects),
      skills: Array.isArray(r.skills) ? arr(r.skills) : seedSkills(),
      habits: arr(r.habits),
      completions: arr(r.completions),
      rewards: arr(r.rewards),
      loot: arr(r.loot),
      events: arr(r.events),
      settings: { ...defaultSettings(), ...((r.settings as object) ?? {}) },
    };
  }
  return null;
}
