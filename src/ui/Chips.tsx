import { Pressable, StyleSheet, Text, View } from 'react-native';
import { c } from './theme';

export function Chips<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={s.row}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={String(o.value)} onPress={() => onChange(o.value)} style={[s.chip, on && s.on]}>
            <Text style={[s.txt, on && s.txtOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: c.line, alignItems: 'center' },
  on: { backgroundColor: c.emberDim, borderColor: c.ember },
  txt: { color: c.dim, fontSize: 15 },
  txtOn: { color: c.text, fontWeight: '600' },
});
