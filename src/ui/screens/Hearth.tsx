import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as A from '../../domain/actions';
import { pickQuests, type Quest } from '../../domain/rightNow';
import { characterLevel, sparks, taskSkillId } from '../../domain/select';
import { hearthStreak, rhythmLabel } from '../../domain/streaks';
import type { Energy } from '../../domain/types';
import { nextTitle, titleFor, xpFor } from '../../domain/xp';
import { useApp } from '../../state/AppState';
import { Chips } from '../Chips';
import { Bar, Btn, Card, Label, Note, Screen } from '../kit';
import { TIME_LABEL, c } from '../theme';

export function Hearth() {
  const { data, loaded, now, act, finish, open, setTab } = useApp();
  const { lastMinutes: minutes, lastEnergy: energy } = data.settings;
  const quests = useMemo(() => pickQuests(data, { minutes, energy }, now), [data, minutes, energy, now]);
  const lv = characterLevel(data);
  const hearth = hearthStreak(data, now);
  const openCount = data.tasks.filter((t) => !t.completedAt).length + data.habits.filter((h) => !h.archivedAt).length;
  const toGo = lv.need - lv.into;
  const next = nextTitle(lv.level);

  return (
    <Screen
      title="Cynnau"
      right={
        <>
          <Pressable onPress={() => setTab('loot')} hitSlop={10} accessibilityRole="button" accessibilityLabel={`${sparks(data)} sparks. Open loot`}>
            <Text style={s.sparks}>✨ {sparks(data)}</Text>
          </Pressable>
          <Pressable onPress={() => open({ type: 'settings' })} hitSlop={10} accessibilityRole="button" accessibilityLabel="Settings">
            <Text style={s.gear}>⚙︎</Text>
          </Pressable>
        </>
      }
    >
      <Pressable onPress={() => setTab('character')} accessibilityRole="button" accessibilityLabel="Open character">
        <Card>
          <View style={s.row}>
            <Text style={s.level}>
              Level {lv.level} · {titleFor(lv.level)}
            </Text>
            <Text style={[s.streak, hearth.atRisk && { color: c.risk }]}>
              🔥 {hearth.streak} {hearth.streak === 1 ? 'day' : 'days'}
            </Text>
          </View>
          <Bar value={lv.progress} />
          <Text style={s.hint}>
            {hearth.atRisk
              ? 'The hearth went cold yesterday. One quest today keeps your streak whole.'
              : next && next.level === lv.level + 1
                ? `${toGo} fuel to level ${next.level}: ${next.title}`
                : `${toGo} fuel to level ${lv.level + 1}`}
          </Text>
        </Card>
      </Pressable>

      <Text style={s.ask} accessibilityRole="header">
        What should I do right now?
      </Text>
      <Label>Time I have</Label>
      <Chips
        value={minutes}
        onChange={(v) => act((d) => A.updateSettings(d, { lastMinutes: v }))}
        options={[
          { label: '5 min', value: 5 },
          { label: '15 min', value: 15 },
          { label: '30 min', value: 30 },
          { label: '1 hr', value: 60 },
          { label: '2 hrs+', value: 120 },
        ]}
      />
      <Label>Energy</Label>
      <Chips
        value={energy}
        onChange={(v: Energy) => act((d) => A.updateSettings(d, { lastEnergy: v }))}
        options={[
          { label: 'Low', value: 'low' },
          { label: 'OK', value: 'ok' },
          { label: 'High', value: 'high' },
        ]}
      />

      <View style={{ gap: 10, marginTop: 10 }}>
        {!loaded ? null : quests.length === 0 ? (
          <Note>
            {openCount === 0
              ? 'Nothing on the hearth yet. Add a quest with the + button, or set up a habit to tend.'
              : 'Nothing fits that window. Try more time, or add a smaller quest.'}
          </Note>
        ) : (
          quests.map((q) => <QuestCard key={q.id} q={q} />)
        )}
      </View>

      <Btn kind="outline" label="+ Add quest" onPress={() => open({ type: 'task' })} style={{ marginTop: 8 }} />
    </Screen>
  );

  function QuestCard({ q }: { q: Quest }) {
    if (q.kind === 'habit') {
      const { habit, streak } = q;
      const skill = data.skills.find((x) => x.id === habit.skillId);
      return (
        <Card style={s.habit}>
          <Text style={s.kind}>🌿 HABIT{streak.atRisk ? ' · STREAK AT RISK' : ''}</Text>
          <Text style={s.qTitle}>{habit.title}</Text>
          <Text style={s.meta}>
            {TIME_LABEL[habit.time]} · +{xpFor(habit.time, 0)} fuel · {rhythmLabel(habit.rhythm)}
            {streak.streak > 0 ? ` · 🔥 ${streak.streak}` : ''}
            {skill ? ` · ${skill.icon} ${skill.name}` : ''}
          </Text>
          <Btn kind="moss" label="Tended" onPress={() => finish((d) => A.tendHabit(d, habit.id))} />
        </Card>
      );
    }
    const { task, stubborn } = q;
    const build = data.projects.find((p) => p.id === task.projectId);
    const skill = data.skills.find((x) => x.id === taskSkillId(data, task));
    return (
      <Card>
        {build && (
          <Text style={s.kind}>
            {skill ? `${skill.icon} ` : '🧱 '}
            {build.name.toUpperCase()}
          </Text>
        )}
        <Text style={s.qTitle}>{task.title}</Text>
        <Text style={s.meta}>
          {TIME_LABEL[task.time]} · +{xpFor(task.time, task.dread, stubborn)} fuel
          {task.dread > 0 ? ` · ${task.dread === 2 ? 'a lot of' : 'some'} dread` : ''}
          {stubborn > 0 ? ` · stubborn +${stubborn * 5}%` : ''}
        </Text>
        <View style={s.actions}>
          <Btn label="Done" onPress={() => finish((d) => A.completeTask(d, task.id))} style={{ flex: 2 }} />
          <Btn kind="quiet" label="Not now" onPress={() => act((d) => A.postponeTask(d, task.id))} style={{ flex: 1 }} />
        </View>
      </Card>
    );
  }
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  sparks: { color: c.spark, fontSize: 16, fontWeight: '700' },
  gear: { color: c.dim, fontSize: 24 },
  level: { color: c.text, fontSize: 16, fontWeight: '700', flexShrink: 1 },
  streak: { color: c.dim, fontSize: 14, fontWeight: '600' },
  hint: { color: c.dim, fontSize: 13 },
  ask: { color: c.text, fontSize: 22, fontWeight: '700', marginTop: 14 },
  habit: { borderLeftWidth: 3, borderLeftColor: c.moss },
  kind: { color: c.dim, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  qTitle: { color: c.text, fontSize: 18, fontWeight: '600' },
  meta: { color: c.dim, fontSize: 13, marginBottom: 4 },
  actions: { flexDirection: 'row', gap: 8 },
});
