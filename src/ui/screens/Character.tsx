import { Pressable, StyleSheet, Text, View } from 'react-native';
import { characterLevel, skillLevel, totalXp } from '../../domain/select';
import { statLevels } from '../../domain/stats';
import { hearthStreak } from '../../domain/streaks';
import { nextTitle, titleFor } from '../../domain/xp';
import { useApp } from '../../state/AppState';
import { Bar, Btn, Card, H, Note, Screen } from '../kit';
import { c } from '../theme';

export function Character() {
  const { data, now, open } = useApp();
  const lv = characterLevel(data);
  const next = nextTitle(lv.level);
  const stats = statLevels(data);
  const hearth = hearthStreak(data, now);
  const quests = data.completions.filter((x) => x.kind === 'task').length;
  const tends = data.completions.length - quests;

  return (
    <Screen
      title="Character"
      right={
        <Pressable onPress={() => open({ type: 'settings' })} hitSlop={10} accessibilityRole="button" accessibilityLabel="Settings">
          <Text style={{ color: c.dim, fontSize: 24 }}>⚙︎</Text>
        </Pressable>
      }
    >
      <Card style={{ alignItems: 'center', paddingVertical: 22 }}>
        <Text style={s.kicker}>LEVEL {lv.level}</Text>
        <Text style={s.name}>{titleFor(lv.level)}</Text>
        <Bar value={lv.progress} height={10} />
        <Text style={s.meta}>
          {lv.into} / {lv.need} fuel{next ? ` · ${next.title} at level ${next.level}` : ''}
        </Text>
      </Card>

      <View style={s.totals}>
        {[
          [totalXp(data), 'fuel burned'],
          [quests, 'quests done'],
          [tends, 'habits tended'],
          [hearth.best, 'best streak'],
        ].map(([n, label]) => (
          <View key={label} style={s.total}>
            <Text style={s.totalN}>{n}</Text>
            <Text style={s.totalL}>{label}</Text>
          </View>
        ))}
      </View>

      <H>Stats</H>
      <Note>Observed from what you actually do. You never set these.</Note>
      <Card style={{ gap: 14 }}>
        {stats.map((st) => (
          <View key={st.key} style={{ gap: 5 }}>
            <View style={s.row}>
              <Text style={s.rowName}>
                {st.icon} {st.name}
              </Text>
              <Text style={s.rowLv}>{st.info.level}</Text>
            </View>
            <Bar value={st.info.progress} color={c.spark} height={6} />
            <Text style={s.meta}>{st.blurb}</Text>
          </View>
        ))}
      </Card>

      <H>Skills</H>
      <Note>Life areas. They grow through the builds and habits linked to them.</Note>
      <Card style={{ gap: 14 }}>
        {data.skills.map((sk) => {
          const info = skillLevel(data, sk.id);
          return (
            <Pressable key={sk.id} onPress={() => open({ type: 'skill', id: sk.id })} accessibilityRole="button" accessibilityLabel={`Edit skill ${sk.name}`} style={{ gap: 5, minHeight: 44, justifyContent: 'center' }}>
              <View style={s.row}>
                <Text style={s.rowName}>
                  {sk.icon} {sk.name}
                </Text>
                <Text style={s.rowLv}>{info.level}</Text>
              </View>
              <Bar value={info.progress} height={6} />
            </Pressable>
          );
        })}
        {data.skills.length === 0 && <Note>No skills yet.</Note>}
      </Card>
      <Btn kind="outline" label="+ New skill" onPress={() => open({ type: 'skill' })} />
    </Screen>
  );
}

const s = StyleSheet.create({
  kicker: { color: c.ember, fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  name: { color: c.text, fontSize: 26, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  meta: { color: c.dim, fontSize: 13 },
  totals: { flexDirection: 'row', gap: 8 },
  total: { flex: 1, backgroundColor: c.card, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  totalN: { color: c.text, fontSize: 19, fontWeight: '800' },
  totalL: { color: c.dim, fontSize: 11, marginTop: 2, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowName: { color: c.text, fontSize: 16, fontWeight: '600' },
  rowLv: { color: c.text, fontSize: 16, fontWeight: '800' },
});
