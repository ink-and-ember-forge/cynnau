// Simple structured records (tasks, projects, skills, completions…) so cloud
// or desktop sync can be added later without a rewrite.
export type TimeBucket = 5 | 30 | 120; // minutes (120 = "2 hrs+")
export type Dread = 0 | 1 | 2; // none / some / a lot
export type Energy = 'low' | 'ok' | 'high';
export type Tier = 'small' | 'medium' | 'big';

export interface Skill {
  id: string;
  name: string;
  icon: string; // emoji
  createdAt: string;
}

/** A Build: a long-term project. Its quests inherit its skill. */
export interface Project {
  id: string;
  name: string;
  skillId: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface Task {
  id: string;
  title: string;
  time: TimeBucket;
  dread: Dread;
  projectId: string | null;
  createdAt: string; // ISO
  completedAt: string | null;
  xpAwarded: number | null;
  postponed: number; // observable: how often "Not now" was tapped
  snoozedUntil: string | null; // day key; hidden from Right Now before this day
}

export type Rhythm = { kind: 'daily' } | { kind: 'weekly'; times: number };

export interface Habit {
  id: string;
  title: string;
  time: TimeBucket;
  skillId: string | null;
  rhythm: Rhythm;
  createdAt: string;
  archivedAt: string | null;
}

/** One row per thing done. Stats, fuel, sparks and streaks are derived from this log. */
export interface Completion {
  id: string;
  kind: 'task' | 'habit';
  refId: string;
  at: string; // ISO
  xp: number;
  sparks: number;
  skillId: string | null;
  time: TimeBucket;
  dread: Dread;
  stubbornDays: number; // capped days the task had rolled over
}

/** A real-life reward, defined once. Its tier sets both price and rarity. */
export interface Reward {
  id: string;
  name: string;
  tier: Tier;
  createdAt: string;
  archivedAt: string | null;
}

export interface LootItem {
  id: string;
  rewardId: string | null; // null = a pouch of sparks
  name: string;
  tier: Tier;
  source: 'drop' | 'bought';
  sparksDelta: number; // negative = price paid, positive = pouch of sparks
  at: string;
  redeemedAt: string | null;
  completionId: string | null; // the completion that dropped it
}

export interface Settings {
  nudgeEnabled: boolean;
  nudgeHour: number; // 24h, local
  lastMinutes: number;
  lastEnergy: Energy;
}

export interface AppData {
  version: 2;
  tasks: Task[];
  projects: Project[];
  skills: Skill[];
  habits: Habit[];
  completions: Completion[];
  rewards: Reward[];
  loot: LootItem[];
  settings: Settings;
}

export const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const defaultSettings = (): Settings => ({ nudgeEnabled: false, nudgeHour: 19, lastMinutes: 30, lastEnergy: 'ok' });

export const seedSkills = (now = new Date()): Skill[] =>
  [
    ['work', 'Work', '💼'],
    ['home', 'Home', '🏠'],
    ['body', 'Body', '🏃'],
    ['mind', 'Mind', '📚'],
    ['craft', 'Craft', '✍️'],
  ].map(([id, name, icon]) => ({ id: `skill-${id}`, name, icon, createdAt: now.toISOString() }));

export const emptyData = (): AppData => ({
  version: 2,
  tasks: [],
  projects: [],
  skills: seedSkills(),
  habits: [],
  completions: [],
  rewards: [],
  loot: [],
  settings: defaultSettings(),
});
