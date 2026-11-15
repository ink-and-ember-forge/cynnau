import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Dread, TimeBucket } from '../domain/types';
import { Chips } from './Chips';
import { c } from './theme';

export function Capture({ onAdd }: { onAdd: (title: string, time: TimeBucket, dread: Dread) => void }) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState<TimeBucket>(30);
  const [dread, setDread] = useState<Dread>(0);

  const submit = () => {
    if (!title.trim()) return;
    onAdd(title.trim(), time, dread);
    setTitle('');
    setTime(30);
    setDread(0);
  };

  return (
    <View style={s.box}>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Add a quest…"
        placeholderTextColor={c.dim}
        style={s.input}
        onSubmitEditing={submit}
        returnKeyType="done"
      />
      <Text style={s.label}>How long?</Text>
      <Chips
        value={time}
        onChange={setTime}
        options={[
          { label: '5 min', value: 5 },
          { label: '30 min', value: 30 },
          { label: '2 hrs+', value: 120 },
        ]}
      />
      <Text style={s.label}>Dread?</Text>
      <Chips
        value={dread}
        onChange={setDread}
        options={[
          { label: 'None', value: 0 },
          { label: 'Some', value: 1 },
          { label: 'A lot', value: 2 },
        ]}
      />
      <Pressable onPress={submit} style={[s.btn, !title.trim() && { opacity: 0.4 }]}>
        <Text style={s.btnTxt}>Add quest</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  box: { backgroundColor: c.card, borderRadius: 16, padding: 16, gap: 10 },
  input: { color: c.text, fontSize: 18, borderBottomWidth: 1, borderColor: c.line, paddingVertical: 8 },
  label: { color: c.dim, fontSize: 13, marginTop: 4 },
  btn: { backgroundColor: c.ember, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  btnTxt: { color: '#1a0f08', fontWeight: '700', fontSize: 16 },
});
