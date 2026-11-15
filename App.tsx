import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { pickQuests, totalFuel } from './src/domain/rightNow';
import { xpFor } from './src/domain/xp';
import { emptyData, type AppData, type Dread, type Energy, type Task, type TimeBucket } from './src/domain/types';
import { exportData, loadData, saveData } from './src/storage/store';
import { Capture } from './src/ui/Capture';
import { Chips } from './src/ui/Chips';
import { c } from './src/ui/theme';

const TIME_LABEL: Record<TimeBucket, string> = { 5: '5 min', 30: '30 min', 120: '2 hrs+' };

export default function App() {
  const [data, setData] = useState<AppData>(emptyData());
  const [loaded, setLoaded] = useState(false);
  const [minutes, setMinutes] = useState(30);
  const [energy, setEnergy] = useState<Energy>('ok');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadData().then((d) => {
      setData(d);
      setLoaded(true);
    });
  }, []);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData((prev) => {
      const next = fn(prev);
      saveData(next).catch(() => Alert.alert('Could not save', 'Your last change may not persist.'));
      return next;
    });
  }, []);

  const addTask = (title: string, time: TimeBucket, dread: Dread) => {
    const task: Task = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      time,
      dread,
      skillId: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      xpAwarded: null,
    };
    update((d) => ({ ...d, tasks: [task, ...d.tasks] }));
    setAdding(false);
  };

  const complete = (id: string) =>
    update((d) => ({
      ...d,
      tasks: d.tasks.map((t) =>
        t.id === id ? { ...t, completedAt: new Date().toISOString(), xpAwarded: xpFor(t.time, t.dread) } : t,
      ),
    }));

  const quests = useMemo(() => pickQuests(data.tasks, { minutes, energy }), [data.tasks, minutes, energy]);
  const openCount = data.tasks.filter((t) => !t.completedAt).length;

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.title}>Cynnau</Text>
          <Text style={s.fuel}>🔥 {totalFuel(data.tasks)} fuel</Text>
        </View>

        <Text style={s.h}>What should I do right now?</Text>
        <Text style={s.label}>Time I have</Text>
        <Chips
          value={minutes}
          onChange={setMinutes}
          options={[
            { label: '15 min', value: 15 },
            { label: '30 min', value: 30 },
            { label: '1 hr', value: 60 },
            { label: '2 hrs+', value: 120 },
          ]}
        />
        <Text style={s.label}>Energy</Text>
        <Chips
          value={energy}
          onChange={setEnergy}
          options={[
            { label: 'Low', value: 'low' },
            { label: 'OK', value: 'ok' },
            { label: 'High', value: 'high' },
          ]}
        />

        <View style={{ gap: 10, marginTop: 8 }}>
          {!loaded ? null : quests.length === 0 ? (
            <Text style={s.empty}>
              {openCount === 0 ? 'Nothing on the hearth yet. Add a quest below.' : 'Nothing fits that window. Try more time, or add a smaller quest.'}
            </Text>
          ) : (
            quests.map((t) => (
              <View key={t.id} style={s.quest}>
                <View style={{ flex: 1 }}>
                  <Text style={s.qTitle}>{t.title}</Text>
                  <Text style={s.qMeta}>
                    {TIME_LABEL[t.time]} · +{xpFor(t.time, t.dread)} fuel
                  </Text>
                </View>
                <Pressable onPress={() => complete(t.id)} style={s.done}>
                  <Text style={s.doneTxt}>Done</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        {adding ? (
          <Capture onAdd={addTask} />
        ) : (
          <Pressable onPress={() => setAdding(true)} style={s.add}>
            <Text style={s.addTxt}>+ Add quest</Text>
          </Pressable>
        )}

        <Pressable onPress={() => exportData(data).catch(() => Alert.alert('Export failed'))} style={s.export}>
          <Text style={s.exportTxt}>Export backup ({data.tasks.length} quests)</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  scroll: { padding: 20, paddingTop: 48, gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { color: c.ember, fontSize: 28, fontWeight: '800' },
  fuel: { color: c.dim, fontSize: 15 },
  h: { color: c.text, fontSize: 22, fontWeight: '700', marginTop: 12 },
  label: { color: c.dim, fontSize: 13, marginTop: 4 },
  empty: { color: c.dim, fontSize: 15, paddingVertical: 12 },
  quest: { backgroundColor: c.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  qTitle: { color: c.text, fontSize: 17, fontWeight: '600' },
  qMeta: { color: c.dim, fontSize: 13, marginTop: 2 },
  done: { backgroundColor: c.emberDim, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
  doneTxt: { color: c.text, fontWeight: '600' },
  add: { borderWidth: 1, borderColor: c.ember, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  addTxt: { color: c.ember, fontWeight: '700', fontSize: 16 },
  export: { alignItems: 'center', paddingVertical: 20 },
  exportTxt: { color: c.dim, fontSize: 13 },
});
