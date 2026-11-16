import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as A from '../../domain/actions';
import { addDays, dayKey, keyToDate } from '../../domain/dates';
import { habitStreak, rhythmLabel } from '../../domain/streaks';
import type { Habit } from '../../domain/types';
import { xpFor } from '../../domain/xp';
import { useApp } from '../../state/AppState';
import { Btn, Card, Note, Screen } from '../kit';
import { TIME_LABEL, c } from '../theme';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function Habits() {
  const { data, now, open, finish } = useApp();
  const habits = data.habits.filter((h) => !h.archivedAt);
  const today = dayKey(now);

  const HabitCard = ({ h }: { h: Habit }) => {
    const info = habitStreak(data, h, now);
    const done = new Set(data.completions.filter((x) => x.kind === 'habit' && x.refId === h.id).map((x) => dayKey(new Date(x.at))));
    const skill = data.skills.find((x) => x.id === h.skillId);
    const unit = h.rhythm.kind === 'daily' ? 'day' : 'week';
    const rested = !info.doneToday && info.count >= info.target; // weekly target already met
    const status = info.atRisk
      ? `Missed one ${unit}. Tend it ${unit === 'day' ? 'today' : 'this week'} to keep ${info.streak}.`
      : info.dipped
        ? `Streak dipped to ${info.streak}, not gone. Pick it back up.`
        : info.streak > 0
          ? `🔥 ${info.streak} ${unit}${info.streak === 1 ? '' : 's'}${info.best > info.streak ? ` · best ${info.best}` : ''}`
          : info.count > 0
            ? 'Kindling'
            : 'Not lit yet';
    return (
      <Card>
        <Pressable onPress={() => open({ type: 'habit', id: h.id })} accessibilityRole="button" accessibilityLabel={`Edit habit ${h.title}`} style={{ gap: 4 }}>
          <Text style={s.title}>{h.title}</Text>
          <Text style={s.meta}>
            {rhythmLabel(h.rhythm)} · {TIME_LABEL[h.time]} · +{xpFor(h.time, 0)} fuel{skill ? ` · ${skill.icon} ${skill.name}` : ''}
          </Text>
        </Pressable>
        <View style={s.week} accessibilityLabel={`Tended ${info.count} of ${info.target} this ${unit}`}>
          {Array.from({ length: 7 }, (_, i) => {
            const key = addDays(today, i - 6);
            const on = done.has(key);
            return (
              <View key={key} style={s.day}>
                <View style={[s.dot, on && s.dotOn, key === today && !on && s.dotToday]} />
                <Text style={s.dow}>{DOW[keyToDate(key).getDay()]}</Text>
              </View>
            );
          })}
        </View>
        <Text style={[s.status, info.atRisk && { color: c.risk }]}>
          {status}
          {h.rhythm.kind === 'weekly' ? ` · ${info.count}/${info.target} this week` : ''}
        </Text>
        <Btn
          kind={info.doneToday ? 'quiet' : 'moss'}
          label={info.doneToday ? 'Tended today ✓' : rested ? 'Tend again (week already kept)' : 'Tended'}
          disabled={info.doneToday}
          onPress={() => finish((d) => A.tendHabit(d, h.id))}
        />
      </Card>
    );
  };

  return (
    <Screen title="Habits">
      <Note>Things you keep. Miss once and nothing happens; miss twice running and the streak dips rather than dies.</Note>
      {habits.map((h) => (
        <HabitCard key={h.id} h={h} />
      ))}
      {habits.length === 0 && <Note>No habits yet. Start with one that takes five minutes.</Note>}
      <Btn kind="outline" label="+ New habit" onPress={() => open({ type: 'habit' })} />
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { color: c.text, fontSize: 18, fontWeight: '600' },
  meta: { color: c.dim, fontSize: 13 },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
  day: { alignItems: 'center', gap: 4, flex: 1 },
  dot: { width: 22, height: 22, borderRadius: 11, backgroundColor: c.line },
  dotOn: { backgroundColor: c.moss },
  dotToday: { backgroundColor: 'transparent', borderWidth: 2, borderColor: c.moss },
  dow: { color: c.faint, fontSize: 11 },
  status: { color: c.dim, fontSize: 14 },
});
