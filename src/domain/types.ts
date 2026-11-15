// Simple structured records so cloud/desktop sync can be added later.
export type TimeBucket = 5 | 30 | 120; // minutes (120 = "2 hrs+")
export type Dread = 0 | 1 | 2; // none / some / a lot
export type Energy = 'low' | 'ok' | 'high';

export interface Task {
  id: string;
  title: string;
  time: TimeBucket;
  dread: Dread;
  skillId: string | null; // reserved: inherited from project later
  createdAt: string; // ISO
  completedAt: string | null;
  xpAwarded: number | null;
}

export interface AppData {
  version: 1;
  tasks: Task[];
}

export const emptyData = (): AppData => ({ version: 1, tasks: [] });
