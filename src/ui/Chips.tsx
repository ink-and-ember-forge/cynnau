import { Pressable, StyleSheet, Text, View } from 'react-native';
import { c } from './theme';

export function Chips<T extends string | number | null>({
  options,
  value,
  onChange,
  wrap,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  wrap?: boolean; // for long, variable lists (builds, skills)
}) {
  return (
    <View style={[s.row, wrap && s.wrap]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[s.chip, wrap ? s.chipWrap : s.chipFill, on && s.on]}
          >
            <Text numberOfLines={1} style={[s.txt, on && s.txtOn]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  wrap: { flexWrap: 'wrap' },
  chip: { minHeight: 46, justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: c.line, alignItems: 'center' },
  chipFill: { flex: 1, paddingHorizontal: 2 },
  chipWrap: { paddingHorizontal: 14, maxWidth: '100%' },
  on: { backgroundColor: c.emberDim, borderColor: c.ember },
  txt: { color: c.dim, fontSize: 15 },
  txtOn: { color: c.text, fontWeight: '600' },
});
