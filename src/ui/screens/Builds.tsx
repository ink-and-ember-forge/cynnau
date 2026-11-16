import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as A from '../../domain/actions';
import { stubbornDays } from '../../domain/select';
import type { Project, Task } from '../../domain/types';
import { xpFor } from '../../domain/xp';
import { useApp } from '../../state/AppState';
import { Bar, Btn, Card, H, Note, Screen } from '../kit';
import { TIME_LABEL, c } from '../theme';

export function Builds() {
  const { data, now, open, finish } = useApp();
  const [showDone, setShowDone] = useState(false);
  const active = data.projects.filter((p) => !p.completedAt);
  const finished = data.projects.filter((p) => p.completedAt);
  const openTasks = data.tasks.filter((t) => !t.completedAt);
  const loose = openTasks.filter((t) => !data.projects.some((p) => p.id === t.projectId));
  const done = data.tasks.filter((t) => t.completedAt).sort((a, b) => b.completedAt!.localeCompare(a.completedAt!));

  const Row = ({ t }: { t: Task }) => {
    const stubborn = stubbornDays(t, now);
    return (
      <View style={s.row}>
        <Pressable onPress={() => finish((d) => A.completeTask(d, t.id))} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Complete ${t.title}`} style={s.check} />
        <Pressable onPress={() => open({ type: 'task', id: t.id })} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={`Edit ${t.title}`}>
          <Text style={s.rowTitle}>{t.title}</Text>
          <Text style={s.meta}>
            {TIME_LABEL[t.time]} · +{xpFor(t.time, t.dread, stubborn)} fuel
            {t.dread > 0 ? ` · ${t.dread === 2 ? 'a lot of' : 'some'} dread` : ''}
            {stubborn > 0 ? ' · stubborn' : ''}
          </Text>
        </Pressable>
      </View>
    );
  };

  const BuildCard = ({ p }: { p: Project }) => {
    const all = data.tasks.filter((t) => t.projectId === p.id);
    const open_ = all.filter((t) => !t.completedAt);
    const skill = data.skills.find((x) => x.id === p.skillId);
    return (
      <Card>
        <Pressable onPress={() => open({ type: 'build', id: p.id })} accessibilityRole="button" accessibilityLabel={`Edit build ${p.name}`} style={{ gap: 6 }}>
          <View style={s.head}>
            <Text style={s.buildName}>
              {skill ? skill.icon : '🧱'} {p.name}
            </Text>
            <Text style={s.meta}>
              {all.length - open_.length}/{all.length} laid
            </Text>
          </View>
          <Bar value={all.length ? (all.length - open_.length) / all.length : 0} height={6} />
        </Pressable>
        {open_.map((t) => (
          <Row key={t.id} t={t} />
        ))}
        <Pressable onPress={() => open({ type: 'task', projectId: p.id })} accessibilityRole="button" style={s.addRow}>
          <Text style={s.addTxt}>+ Add a quest to this build</Text>
        </Pressable>
      </Card>
    );
  };

  return (
    <Screen title="Builds">
      <Note>Things you are building over time. Quests inside a build grow its skill.</Note>
      {active.map((p) => (
        <BuildCard key={p.id} p={p} />
      ))}
      <Btn kind="outline" label="+ New build" onPress={() => open({ type: 'build' })} />

      <H>Loose quests</H>
      {loose.length === 0 ? (
        <Note>No loose quests. Anything you capture without a build lands here.</Note>
      ) : (
        <Card>
          {loose.map((t) => (
            <Row key={t.id} t={t} />
          ))}
        </Card>
      )}
      <Btn kind="quiet" label="+ Add quest" onPress={() => open({ type: 'task' })} />

      {(done.length > 0 || finished.length > 0) && (
        <Pressable onPress={() => setShowDone((v) => !v)} accessibilityRole="button" style={s.toggle}>
          <Text style={s.addTxt}>
            {showDone ? 'Hide' : 'Show'} finished ({done.length} quests{finished.length ? `, ${finished.length} builds` : ''})
          </Text>
        </Pressable>
      )}
      {showDone && (
        <Card>
          {finished.map((p) => (
            <Pressable key={p.id} onPress={() => open({ type: 'build', id: p.id })} style={s.doneRow} accessibilityRole="button">
              <Text style={s.doneTitle}>🏛️ {p.name}</Text>
              <Text style={s.meta}>build finished</Text>
            </Pressable>
          ))}
          {done.slice(0, 30).map((t) => (
            <View key={t.id} style={s.doneRow}>
              <Text style={s.doneTitle} numberOfLines={1}>
                ✓ {t.title}
              </Text>
              <Text style={s.meta}>+{t.xpAwarded ?? 0}</Text>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  buildName: { color: c.text, fontSize: 17, fontWeight: '700', flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
  check: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: c.ember },
  rowTitle: { color: c.text, fontSize: 16 },
  meta: { color: c.dim, fontSize: 13 },
  addRow: { minHeight: 44, justifyContent: 'center' },
  addTxt: { color: c.ember, fontSize: 14, fontWeight: '600' },
  toggle: { minHeight: 48, justifyContent: 'center', alignItems: 'center', marginTop: 6 },
  doneRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, minHeight: 36 },
  doneTitle: { color: c.dim, fontSize: 15, flexShrink: 1 },
});
