import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { addDays, dayKey, keyToDate } from '../domain/dates';
import { DAY_PARTS, insights } from '../domain/insights';
import { useApp } from '../state/AppState';
import { Chips } from './Chips';
import { Bar, Label, Note, Sheet } from './kit';
import { c } from './theme';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '–');

/** Private, on-device answers to: is the cue working, and are the picks any good? */
export function InsightsSheet() {
  const { data, now, close } = useApp();
  const [span, setSpan] = useState(7);
  const i = insights(data, now, span);
  const max = Math.max(1, ...i.days.map((d) => d.opens));
  const today = dayKey(now);
  const picks = i.hearthDone + i.postponed;
  const peak = DAY_PARTS.reduce((a, b) => (i.byPart[b.key] > i.byPart[a.key] ? b : a));
  const thin = i.trackedDays < Math.min(span, 5);

  return (
    <Sheet title="Insights" onClose={close}>
      <Chips
        value={span}
        onChange={setSpan}
        options={[
          { label: 'Last 7 days', value: 7 },
          { label: 'Last 28 days', value: 28 },
        ]}
      />
      {thin && (
        <Note>
          Only {i.trackedDays} {i.trackedDays === 1 ? 'day' : 'days'} logged so far. Treat these as a first glimpse, not a pattern.
        </Note>
      )}

      <Label>Is the cue working?</Label>
      <View style={s.tiles}>
        <Tile n={`${i.activeDays}/${Math.min(span, i.trackedDays)}`} label="days opened" />
        <Tile n={String(i.opens)} label="visits" />
        <Tile n={pct(i.opensWithAction, i.opens)} label="visits that led to action" />
      </View>

      <Text style={s.chartTitle}>Visits per day</Text>
      <View style={s.chart} accessible accessibilityLabel={`Visits per day: ${i.days.map((d) => `${keyToDate(d.key).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })} ${d.opens}`).join(', ')}`}>
        {i.days.map((d) => (
          <View key={d.key} style={s.col}>
            {span === 7 && <Text style={s.val}>{d.opens || ''}</Text>}
            <View style={[s.bar, { height: Math.max(d.opens ? 4 : 1, (d.opens / max) * 64), backgroundColor: d.opens ? c.ember : c.line }]} />
            {span === 7 ? (
              <Text style={[s.tick, d.key === today && s.tickToday]}>{DOW[keyToDate(d.key).getDay()]}</Text>
            ) : (
              <View style={[s.dot, d.done > 0 && { backgroundColor: c.moss }]} />
            )}
          </View>
        ))}
      </View>
      <Text style={s.caption}>
        {span === 7
          ? `Most visits come in the ${peak.label.toLowerCase()}.`
          : `${addDays(today, -27).slice(5)} to today, tallest bar = ${max} ${max === 1 ? 'visit' : 'visits'}. Green dot: something was done that day.`}
        {i.nudgeOpens > 0 ? ` ${i.nudgeOpens} came from the evening nudge.` : ''}
      </Text>

      <View style={{ gap: 6, marginTop: 4 }}>
        {DAY_PARTS.map((p) => (
          <View key={p.key} style={s.partRow}>
            <Text style={s.partName}>{p.label}</Text>
            <View style={{ flex: 1 }}>
              <Bar value={i.opens ? i.byPart[p.key] / i.opens : 0} height={6} />
            </View>
            <Text style={s.partN}>{i.byPart[p.key]}</Text>
          </View>
        ))}
      </View>

      <Label>Are the Right Now picks any good?</Label>
      <View style={s.tiles}>
        <Tile n={String(i.hearthDone)} label="picks done" />
        <Tile n={String(i.postponed)} label={'"Not now"'} />
        <Tile n={pct(i.hearthDone, picks)} label="picks accepted" />
      </View>
      <Note>
        {i.listDone} more {i.listDone === 1 ? 'was' : 'were'} done straight from the Builds and Habits lists. If that number dwarfs picks done, the Hearth is not earning its place.
      </Note>

      <Label>Is the pile growing?</Label>
      <View style={s.tiles}>
        <Tile n={String(i.captured)} label="quests captured" />
        <Tile n={String(i.questsDone)} label="quests done" />
        <Tile n={String(i.habitsTended)} label="habits tended" />
      </View>

      <Label>Rewards</Label>
      <View style={s.tiles}>
        <Tile n={String(i.fuel)} label="fuel" />
        <Tile n={`${i.sparksEarned} / ${i.sparksSpent}`} label="sparks in / out" />
        <Tile n={String(i.drops)} label="loot drops" />
      </View>
      <Text style={s.caption}>This log never leaves your phone, except inside your own backups.</Text>
    </Sheet>
  );
}

const Tile = ({ n, label }: { n: string; label: string }) => (
  <View style={s.tile}>
    <Text style={s.tileN}>{n}</Text>
    <Text style={s.tileL}>{label}</Text>
  </View>
);

const s = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, backgroundColor: c.raised, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center' },
  tileN: { color: c.text, fontSize: 18, fontWeight: '800' },
  tileL: { color: c.dim, fontSize: 11, marginTop: 2, textAlign: 'center' },
  chartTitle: { color: c.text, fontSize: 14, fontWeight: '600', marginTop: 6 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 104, borderBottomWidth: 0 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: { alignSelf: 'stretch', marginHorizontal: 1, maxWidth: 28, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  val: { color: c.dim, fontSize: 11 },
  tick: { color: c.faint, fontSize: 11 },
  tickToday: { color: c.text, fontWeight: '700' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent' },
  caption: { color: c.faint, fontSize: 12, lineHeight: 17 },
  partRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  partName: { color: c.dim, fontSize: 13, width: 76 },
  partN: { color: c.text, fontSize: 13, fontWeight: '600', width: 24, textAlign: 'right' },
});
