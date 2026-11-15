import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { TIER_ICON } from '../domain/loot';
import { useApp } from '../state/AppState';
import { c } from './theme';

/** The reward moment: what you just earned, with a way to take it back. */
export function RewardToast({ bottom }: { bottom: number }) {
  const { toast, dismissToast, undo } = useApp();
  const fade = useRef(new Animated.Value(0)).current;
  const o = toast?.outcome;
  const big = !!(o && (o.levelUp || o.drop || o.skill?.levelUp));

  useEffect(() => {
    if (!toast) return;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    const t = setTimeout(dismissToast, big ? 9000 : o ? 5000 : 3000);
    return () => clearTimeout(t);
  }, [toast?.key]);

  if (!toast) return null;
  return (
    <Animated.View
      style={[s.wrap, { bottom, opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}
      accessibilityLiveRegion="polite"
    >
      <Pressable onPress={dismissToast} style={[s.box, big && s.big]}>
        {o ? (
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={s.gain}>
              +{o.xp} fuel <Text style={s.spark}> +{o.sparks} ✨</Text>
            </Text>
            <Text style={s.line} numberOfLines={1}>
              {o.title}
              {o.stubbornDays > 0 ? ' · stubborn bonus' : ''}
            </Text>
            {o.levelUp && <Text style={s.up}>⬆ Level {o.level}{o.newTitle ? `: ${o.newTitle}` : ''}</Text>}
            {o.skill?.levelUp && (
              <Text style={s.up}>
                {o.skill.icon} {o.skill.name} reached level {o.skill.level}
              </Text>
            )}
            {o.streak != null && o.streak > 1 && <Text style={s.line}>🔥 Streak: {o.streak}</Text>}
            {o.drop && (
              <Text style={s.loot}>
                {o.drop.rewardId ? TIER_ICON[o.drop.tier] : '✨'} Loot: {o.drop.name}
              </Text>
            )}
          </View>
        ) : (
          <Text style={[s.line, { flex: 1, color: c.text }]}>{toast.message}</Text>
        )}
        {toast.undo && (
          <Pressable onPress={undo} hitSlop={10} accessibilityRole="button" style={s.undo}>
            <Text style={s.undoTxt}>Undo</Text>
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12 },
  box: { backgroundColor: c.raised, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: c.line },
  big: { borderColor: c.spark },
  gain: { color: c.ember, fontSize: 18, fontWeight: '800' },
  spark: { color: c.spark, fontSize: 15, fontWeight: '600' },
  line: { color: c.dim, fontSize: 14 },
  up: { color: c.text, fontSize: 15, fontWeight: '700' },
  loot: { color: c.spark, fontSize: 15, fontWeight: '700' },
  undo: { minHeight: 44, minWidth: 56, alignItems: 'center', justifyContent: 'center' },
  undoTxt: { color: c.dim, fontWeight: '600', fontSize: 14, textDecorationLine: 'underline' },
});
