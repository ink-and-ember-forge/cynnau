import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { habitDue, habitStreak } from './src/domain/streaks';
import { AppProvider, useApp, type Tab } from './src/state/AppState';
import { BuildSheet, HabitSheet, RewardSheet, SettingsSheet, SkillSheet, TaskSheet } from './src/ui/Forms';
import { InsightsSheet } from './src/ui/Insights';
import { RewardToast } from './src/ui/RewardToast';
import { Builds } from './src/ui/screens/Builds';
import { Character } from './src/ui/screens/Character';
import { Habits } from './src/ui/screens/Habits';
import { Hearth } from './src/ui/screens/Hearth';
import { Loot } from './src/ui/screens/Loot';
import { c } from './src/ui/theme';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'hearth', label: 'Hearth', icon: '🔥' },
  { key: 'builds', label: 'Builds', icon: '🧱' },
  { key: 'habits', label: 'Habits', icon: '🌿' },
  { key: 'character', label: 'Character', icon: '🛡️' },
  { key: 'loot', label: 'Loot', icon: '🎁' },
];
const TAB_HEIGHT = 58;

function Shell() {
  const { tab, setTab, sheet, data, now } = useApp();
  const insets = useSafeAreaInsets();

  // Back returns to the hearth before leaving the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tab === 'hearth') return false;
      setTab('hearth');
      return true;
    });
    return () => sub.remove();
  }, [tab, setTab]);

  const badge: Partial<Record<Tab, number>> = {
    habits: data.habits.filter((h) => !h.archivedAt && habitDue(habitStreak(data, h, now))).length,
    loot: data.loot.filter((l) => !l.redeemedAt).length,
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <View style={{ flex: 1 }}>
        {tab === 'hearth' && <Hearth />}
        {tab === 'builds' && <Builds />}
        {tab === 'habits' && <Habits />}
        {tab === 'character' && <Character />}
        {tab === 'loot' && <Loot />}
      </View>

      <View style={[s.tabs, { paddingBottom: insets.bottom, height: TAB_HEIGHT + insets.bottom }]} accessibilityRole="tablist">
        {TABS.map((t) => {
          const on = t.key === tab;
          const n = badge[t.key] ?? 0;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={s.tab} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={n ? `${t.label}, ${n} waiting` : t.label}>
              <View>
                <Text style={[s.icon, !on && { opacity: 0.45 }]}>{t.icon}</Text>
                {n > 0 && <View style={s.badge} />}
              </View>
              <Text style={[s.tabTxt, on && { color: c.ember, fontWeight: '700' }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <RewardToast bottom={TAB_HEIGHT + insets.bottom + 10} />

      {sheet?.type === 'task' && <TaskSheet id={sheet.id} projectId={sheet.projectId} />}
      {sheet?.type === 'habit' && <HabitSheet id={sheet.id} />}
      {sheet?.type === 'build' && <BuildSheet id={sheet.id} />}
      {sheet?.type === 'skill' && <SkillSheet id={sheet.id} />}
      {sheet?.type === 'reward' && <RewardSheet />}
      {sheet?.type === 'settings' && <SettingsSheet />}
      {sheet?.type === 'insights' && <InsightsSheet />}
    </KeyboardAvoidingView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  tabs: { flexDirection: 'row', backgroundColor: c.card, borderTopWidth: 1, borderColor: c.line },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  icon: { fontSize: 20 },
  tabTxt: { color: c.dim, fontSize: 11 },
  badge: { position: 'absolute', top: -1, right: -7, width: 9, height: 9, borderRadius: 5, backgroundColor: c.ember },
});
