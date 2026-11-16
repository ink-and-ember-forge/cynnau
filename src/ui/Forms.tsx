import { useState } from 'react';
import { Text, View } from 'react-native';
import * as A from '../domain/actions';
import { PRICE, TIER_ICON, TIER_LABEL } from '../domain/loot';
import type { Dread, Rhythm, Tier, TimeBucket } from '../domain/types';
import { syncNudge } from '../notifications';
import { useApp } from '../state/AppState';
import { autoBackupSupported, backupFolderName, exportData, importData, pickBackupFolder } from '../storage/store';
import { Chips } from './Chips';
import { Btn, ConfirmBtn, Field, Label, Note, Sheet } from './kit';
import { emptyData } from '../domain/types';
import { c } from './theme';

const TIME_OPTS: { label: string; value: TimeBucket }[] = [
  { label: '5 min', value: 5 },
  { label: '30 min', value: 30 },
  { label: '2 hrs+', value: 120 },
];
const DREAD_OPTS: { label: string; value: Dread }[] = [
  { label: 'None', value: 0 },
  { label: 'Some', value: 1 },
  { label: 'A lot', value: 2 },
];

function useSkillOpts() {
  const { data } = useApp();
  return [{ label: 'None', value: null as string | null }, ...data.skills.map((s) => ({ label: `${s.icon} ${s.name}`, value: s.id as string | null }))];
}

/** Capture: a title and two taps. The build is optional and the skill is inherited from it. */
export function TaskSheet({ id, projectId }: { id?: string; projectId?: string | null }) {
  const { data, act, close, say } = useApp();
  const existing = data.tasks.find((t) => t.id === id);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [time, setTime] = useState<TimeBucket>(existing?.time ?? 30);
  const [dread, setDread] = useState<Dread>(existing?.dread ?? 0);
  const [project, setProject] = useState<string | null>(existing?.projectId ?? projectId ?? null);
  const builds = data.projects.filter((p) => !p.completedAt || p.id === project);
  const ok = title.trim().length > 0;

  const submit = () => {
    if (!ok) return;
    const f = { title: title.trim(), time, dread, projectId: project };
    act((d) => (existing ? A.updateTask(d, existing.id, f) : A.addTask(d, f)));
    if (!existing) say(`Added "${f.title}"`);
    close();
  };

  return (
    <Sheet title={existing ? 'Edit quest' : 'New quest'} onClose={close}>
      <Field value={title} onChangeText={setTitle} placeholder="What needs doing?" autoFocus={!existing} onSubmit={submit} />
      <Label>How long?</Label>
      <Chips value={time} onChange={setTime} options={TIME_OPTS} />
      <Label>Dread?</Label>
      <Chips value={dread} onChange={setDread} options={DREAD_OPTS} />
      {builds.length > 0 && (
        <>
          <Label>Part of a build? (optional)</Label>
          <Chips wrap value={project} onChange={setProject} options={[{ label: 'Loose', value: null as string | null }, ...builds.map((p) => ({ label: p.name, value: p.id as string | null }))]} />
        </>
      )}
      <Btn label={existing ? 'Save' : 'Add quest'} onPress={submit} disabled={!ok} style={{ marginTop: 6 }} />
      {existing && (
        <ConfirmBtn
          label="Delete quest"
          confirm="Tap again to delete"
          onConfirm={() => {
            act((d) => A.deleteTask(d, existing.id));
            close();
          }}
        />
      )}
    </Sheet>
  );
}

const RHYTHMS: { label: string; value: number }[] = [
  { label: 'Daily', value: 0 },
  { label: '5×', value: 5 },
  { label: '3×', value: 3 },
  { label: '2×', value: 2 },
  { label: '1×', value: 1 },
];

export function HabitSheet({ id }: { id?: string }) {
  const { data, act, close } = useApp();
  const existing = data.habits.find((h) => h.id === id);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [time, setTime] = useState<TimeBucket>(existing?.time ?? 5);
  const [times, setTimes] = useState(existing ? (existing.rhythm.kind === 'daily' ? 0 : existing.rhythm.times) : 0);
  const [skillId, setSkillId] = useState<string | null>(existing?.skillId ?? null);
  const skills = useSkillOpts();
  const ok = title.trim().length > 0;
  // Keep any custom rhythm that came from an import selectable.
  const rhythms = RHYTHMS.some((r) => r.value === times) ? RHYTHMS : [...RHYTHMS, { label: `${times}×`, value: times }];

  const submit = () => {
    if (!ok) return;
    const rhythm: Rhythm = times === 0 ? { kind: 'daily' } : { kind: 'weekly', times };
    const f = { title: title.trim(), time, rhythm, skillId };
    act((d) => (existing ? A.updateHabit(d, existing.id, f) : A.addHabit(d, f)));
    close();
  };

  return (
    <Sheet title={existing ? 'Edit habit' : 'New habit'} onClose={close}>
      <Field value={title} onChangeText={setTitle} placeholder="Something to keep tending" autoFocus={!existing} onSubmit={submit} />
      <Label>How long does it take?</Label>
      <Chips value={time} onChange={setTime} options={TIME_OPTS} />
      <Label>Rhythm{times > 0 ? ' (times a week)' : ''}</Label>
      <Chips value={times} onChange={setTimes} options={rhythms} />
      <Label>Which skill does it grow?</Label>
      <Chips wrap value={skillId} onChange={setSkillId} options={skills} />
      <Btn label={existing ? 'Save' : 'Add habit'} onPress={submit} disabled={!ok} style={{ marginTop: 6 }} />
      {existing && (
        <ConfirmBtn
          label="Retire habit"
          confirm="Tap again to retire (fuel earned is kept)"
          onConfirm={() => {
            act((d) => A.updateHabit(d, existing.id, { archivedAt: new Date().toISOString() }));
            close();
          }}
        />
      )}
    </Sheet>
  );
}

export function BuildSheet({ id }: { id?: string }) {
  const { data, act, close } = useApp();
  const existing = data.projects.find((p) => p.id === id);
  const [name, setName] = useState(existing?.name ?? '');
  const [skillId, setSkillId] = useState<string | null>(existing?.skillId ?? null);
  const skills = useSkillOpts();
  const ok = name.trim().length > 0;

  const submit = () => {
    if (!ok) return;
    const f = { name: name.trim(), skillId };
    act((d) => (existing ? A.updateProject(d, existing.id, f) : A.addProject(d, f)));
    close();
  };

  return (
    <Sheet title={existing ? 'Edit build' : 'New build'} onClose={close}>
      <Field value={name} onChangeText={setName} placeholder="Something you are building" autoFocus={!existing} onSubmit={submit} />
      <Label>Which skill does it grow?</Label>
      <Chips wrap value={skillId} onChange={setSkillId} options={skills} />
      <Note>Set once here. Every quest in this build inherits it, so capture never asks.</Note>
      <Btn label={existing ? 'Save' : 'Start build'} onPress={submit} disabled={!ok} style={{ marginTop: 6 }} />
      {existing && (
        <>
          <Btn
            kind="quiet"
            label={existing.completedAt ? 'Reopen build' : 'Mark build finished'}
            onPress={() => {
              act((d) => A.updateProject(d, existing.id, { completedAt: existing.completedAt ? null : new Date().toISOString() }));
              close();
            }}
          />
          <ConfirmBtn
            label="Delete build"
            confirm="Tap again to delete (quests are kept as loose)"
            onConfirm={() => {
              act((d) => A.deleteProject(d, existing.id));
              close();
            }}
          />
        </>
      )}
    </Sheet>
  );
}

export function SkillSheet({ id }: { id?: string }) {
  const { data, act, close } = useApp();
  const existing = data.skills.find((s) => s.id === id);
  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState(existing?.icon ?? '⭐');
  const ok = name.trim().length > 0;

  const submit = () => {
    if (!ok) return;
    const f = { name: name.trim(), icon: icon.trim() || '⭐' };
    act((d) => (existing ? A.updateSkill(d, existing.id, f) : A.addSkill(d, f)));
    close();
  };

  return (
    <Sheet title={existing ? 'Edit skill' : 'New skill'} onClose={close}>
      <Field value={name} onChangeText={setName} placeholder="A life area, e.g. Running" autoFocus={!existing} onSubmit={submit} maxLength={24} />
      <Label>Icon (any emoji)</Label>
      <Field value={icon} onChangeText={setIcon} placeholder="⭐" maxLength={4} />
      <Btn label={existing ? 'Save' : 'Add skill'} onPress={submit} disabled={!ok} style={{ marginTop: 6 }} />
      {existing && (
        <ConfirmBtn
          label="Delete skill"
          confirm="Tap again to delete (your level keeps the fuel)"
          onConfirm={() => {
            act((d) => A.deleteSkill(d, existing.id));
            close();
          }}
        />
      )}
    </Sheet>
  );
}

export function RewardSheet() {
  const { act, close } = useApp();
  const [name, setName] = useState('');
  const [tier, setTier] = useState<Tier>('small');
  const ok = name.trim().length > 0;
  const submit = () => {
    if (!ok) return;
    act((d) => A.addReward(d, { name: name.trim(), tier }));
    close();
  };
  return (
    <Sheet title="New reward" onClose={close}>
      <Field value={name} onChangeText={setName} placeholder="A real treat, e.g. Coffee out" autoFocus onSubmit={submit} />
      <Label>How big a treat is it?</Label>
      <Chips value={tier} onChange={setTier} options={(['small', 'medium', 'big'] as Tier[]).map((t) => ({ label: `${TIER_ICON[t]} ${t[0].toUpperCase()}${t.slice(1)}`, value: t }))} />
      <Note>
        {TIER_LABEL[tier]}: costs {PRICE[tier]} sparks, and {tier === 'small' ? 'is the most likely drop' : tier === 'medium' ? 'drops now and then' : 'drops very rarely'}. Size is all you set; price and rarity follow.
      </Note>
      <Btn label="Add reward" onPress={submit} disabled={!ok} style={{ marginTop: 6 }} />
    </Sheet>
  );
}

const HOURS = [18, 19, 20, 21];

export function SettingsSheet() {
  const { data, act, close, open, say, replaceAll, backupNow } = useApp();
  const { nudgeEnabled, nudgeHour, backupDirUri, backupLastAt } = data.settings;

  const chooseFolder = async () => {
    const picked = await pickBackupFolder();
    if (!picked) return;
    act((d) => A.updateSettings(d, { backupDirUri: picked.uri }));
    const err = backupNow();
    say(err ? `Could not write to that folder: ${err}` : `Backing up to ${picked.name}.`);
  };

  const setNudge = async (enabled: boolean, hour: number) => {
    try {
      const granted = await syncNudge(enabled, hour);
      act((d) => A.updateSettings(d, { nudgeEnabled: enabled && granted, nudgeHour: hour }));
      if (!granted) say('Notifications are blocked. Allow them in system settings to get the nudge.');
    } catch {
      say('Could not schedule the nudge on this device.');
    }
  };

  const doImport = async () => {
    try {
      const d = await importData();
      if (!d) return;
      // The backup folder belongs to this phone, not to the file being restored.
      replaceAll(A.updateSettings(d, { backupDirUri, backupLastAt }));
      await syncNudge(d.settings.nudgeEnabled, d.settings.nudgeHour).catch(() => {});
      say('Backup restored.');
      close();
    } catch {
      say('That file is not a Cynnau backup.');
    }
  };

  return (
    <Sheet title="Settings" onClose={close}>
      <Label>Evening nudge</Label>
      <Chips
        value={nudgeEnabled ? 1 : 0}
        onChange={(v) => setNudge(v === 1, nudgeHour)}
        options={[
          { label: 'Off', value: 0 },
          { label: 'On', value: 1 },
        ]}
      />
      {nudgeEnabled && <Chips value={nudgeHour} onChange={(h) => setNudge(true, h)} options={HOURS.map((h) => ({ label: `${h}:00`, value: h }))} />}
      <Note>One gentle prompt a day at most. Nothing else in Cynnau ever notifies you.</Note>

      <Btn kind="quiet" label="📈 Insights: is it working?" onPress={() => open({ type: 'insights' })} />

      <Label>Automatic backup</Label>
      {!autoBackupSupported ? (
        <Note>Automatic backup works in the Android app. Here, use Export below.</Note>
      ) : backupDirUri ? (
        <>
          <Note>
            Saving to "{backupFolderName(backupDirUri)}" whenever you leave the app, one file a day for the last 7 days.{' '}
            {backupLastAt ? `Last backup: ${new Date(backupLastAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.` : 'No backup written yet.'}
          </Note>
          <Btn
            kind="outline"
            label="Back up now"
            onPress={() => {
              const err = backupNow();
              say(err ? `Backup failed: ${err}` : 'Backed up.');
            }}
          />
          <Btn kind="quiet" label="Change folder" onPress={chooseFolder} />
          <ConfirmBtn label="Turn off automatic backup" confirm="Tap again to turn it off" onConfirm={() => act((d) => A.updateSettings(d, { backupDirUri: null }))} />
        </>
      ) : (
        <>
          <Note>Pick a folder once and Cynnau keeps a dated backup there every time you leave the app. Choose a Google Drive folder to keep it safe off the phone too.</Note>
          <Btn kind="outline" label="Choose backup folder" onPress={chooseFolder} />
        </>
      )}

      <Label>Manual backup</Label>
      <Btn kind="quiet" label="Export a copy" onPress={() => exportData(data).catch(() => say('Export failed.'))} />
      <Btn kind="quiet" label="Restore from backup" onPress={doImport} />
      <ConfirmBtn
        label="Erase everything"
        confirm="Tap again to erase all data"
        onConfirm={() => {
          replaceAll(A.updateSettings(emptyData(), { backupDirUri: null, backupLastAt: null }));
          syncNudge(false, 19).catch(() => {});
          say('Everything erased.');
          close();
        }}
      />
      <View style={{ borderTopWidth: 1, borderColor: c.line, paddingTop: 10 }}>
        <Text style={{ color: c.faint, fontSize: 12, lineHeight: 17 }}>
          How it works: fuel = time (10 / 40 / 120) × dread (×1, ×1.15, ×1.3), plus 5% per day a quest has rolled over, capped at 25%. Sparks are a tenth of fuel. Loot drops on roughly 6–15% of completions. A missed
          habit day is forgiven once; after that the streak halves instead of resetting. The day turns over at 4am.
        </Text>
      </View>
    </Sheet>
  );
}
