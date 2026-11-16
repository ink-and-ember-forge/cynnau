import { useEffect, useState, type ReactNode } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { c } from './theme';

export function Screen({ children, title, right }: { children: ReactNode; title: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView contentContainerStyle={[s.screen, { paddingTop: insets.top + 16 }]} keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <Text style={s.title} accessibilityRole="header">
          {title}
        </Text>
        <View style={s.headerRight}>{right}</View>
      </View>
      {children}
    </ScrollView>
  );
}

export const H = ({ children }: { children: ReactNode }) => (
  <Text style={s.h} accessibilityRole="header">
    {children}
  </Text>
);
export const Label = ({ children }: { children: ReactNode }) => <Text style={s.label}>{children}</Text>;
export const Note = ({ children }: { children: ReactNode }) => <Text style={s.note}>{children}</Text>;
export const Card = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[s.card, style]}>{children}</View>;

export function Btn({
  label,
  onPress,
  kind = 'primary',
  disabled,
  small,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'outline' | 'quiet' | 'moss';
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [s.btn, small && s.btnSmall, s[`btn_${kind}`], disabled && { opacity: 0.4 }, pressed && { opacity: 0.7 }, style]}
    >
      <Text style={[s.btnTxt, small && { fontSize: 14 }, s[`txt_${kind}`]]}>{label}</Text>
    </Pressable>
  );
}

/** A destructive action that needs a second tap, so nothing is lost to a slip. */
export function ConfirmBtn({ label, confirm = 'Tap again to confirm', onConfirm, left }: { label: string; confirm?: string; onConfirm: () => void; left?: boolean }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <Pressable onPress={() => (armed ? onConfirm() : setArmed(true))} accessibilityRole="button" style={[s.confirm, left && { alignItems: 'flex-start' }]}>
      <Text style={[s.confirmTxt, armed && { color: c.risk, fontWeight: '700' }]}>{armed ? confirm : label}</Text>
    </Pressable>
  );
}

export function Bar({ value, color = c.ember, height = 8 }: { value: number; color?: string; height?: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={[s.bar, { height, borderRadius: height / 2 }]}>
      <View style={{ width: `${pct}%`, minWidth: pct > 0 ? height : 0, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

export function Field({ value, onChangeText, placeholder, autoFocus, onSubmit, maxLength }: { value: string; onChangeText: (v: string) => void; placeholder: string; autoFocus?: boolean; onSubmit?: () => void; maxLength?: number }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={c.faint}
      style={s.input}
      autoFocus={autoFocus}
      onSubmitEditing={onSubmit}
      returnKeyType="done"
      maxLength={maxLength ?? 120}
    />
  );
}

/**
 * A panel anchored to the top of the screen, so the keyboard never covers
 * the fields. The Android back button and the backdrop both close it.
 */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [onClose]);
  return (
    <View style={s.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      <View style={[s.sheet, { marginTop: insets.top + 8, maxHeight: '88%' }]}>
        <View style={s.sheetHead}>
          <Text style={s.sheetTitle} accessibilityRole="header">
            {title}
          </Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
            <Text style={s.close}>✕</Text>
          </Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { paddingHorizontal: 20, paddingBottom: 120, gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  title: { color: c.ember, fontSize: 28, fontWeight: '800' },
  h: { color: c.text, fontSize: 19, fontWeight: '700', marginTop: 14 },
  label: { color: c.dim, fontSize: 13, marginTop: 4 },
  note: { color: c.dim, fontSize: 14, lineHeight: 20 },
  card: { backgroundColor: c.card, borderRadius: 16, padding: 16, gap: 8 },
  btn: { borderRadius: 12, minHeight: 48, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  btnSmall: { minHeight: 44, paddingHorizontal: 14, borderRadius: 10 },
  btn_primary: { backgroundColor: c.ember },
  btn_outline: { borderWidth: 1, borderColor: c.ember },
  btn_quiet: { backgroundColor: c.raised },
  btn_moss: { backgroundColor: c.moss },
  btnTxt: { fontWeight: '700', fontSize: 16 },
  txt_primary: { color: c.onEmber },
  txt_outline: { color: c.ember },
  txt_quiet: { color: c.text },
  txt_moss: { color: '#14200c' },
  confirm: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  confirmTxt: { color: c.dim, fontSize: 14 },
  bar: { backgroundColor: c.line, overflow: 'hidden', alignSelf: 'stretch' },
  input: { color: c.text, fontSize: 18, borderBottomWidth: 1, borderColor: c.line, paddingVertical: 10 },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(8,5,3,0.78)', paddingHorizontal: 12 },
  sheet: { backgroundColor: c.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: c.line },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sheetTitle: { color: c.text, fontSize: 19, fontWeight: '700' },
  close: { color: c.dim, fontSize: 20, padding: 4 },
});
