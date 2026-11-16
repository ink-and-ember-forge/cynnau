import { StyleSheet, Text, View } from 'react-native';
import * as A from '../../domain/actions';
import { PRICE, TIER_ICON, TIER_LABEL } from '../../domain/loot';
import { sparks } from '../../domain/select';
import type { Tier } from '../../domain/types';
import { useApp } from '../../state/AppState';
import { Btn, Card, ConfirmBtn, H, Note, Screen } from '../kit';
import { c } from '../theme';

const TIERS: Tier[] = ['small', 'medium', 'big'];

export function Loot() {
  const { data, act, open, say } = useApp();
  const balance = sparks(data);
  const stash = data.loot.filter((l) => !l.redeemedAt);
  const rewards = data.rewards.filter((r) => !r.archivedAt);
  const history = data.loot.filter((l) => l.redeemedAt).slice(0, 12);

  return (
    <Screen title="Loot" right={<Text style={s.balance}>✨ {balance}</Text>}>
      <Note>Real treats you chose once. Sparks trickle in from everything you do; now and then a reward simply drops.</Note>

      <H>Your stash</H>
      {stash.length === 0 ? (
        <Note>Empty for now. Loot turns up when you least expect it.</Note>
      ) : (
        stash.map((l) => (
          <Card key={l.id} style={s.item}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>
                {TIER_ICON[l.tier]} {l.name}
              </Text>
              <Text style={s.meta}>{l.source === 'drop' ? 'Dropped' : 'Bought'} · yours to enjoy</Text>
            </View>
            <Btn small label="Enjoy it" onPress={() => { act((d) => A.redeemLoot(d, l.id)); say(`Enjoy: ${l.name}`); }} />
          </Card>
        ))
      )}

      <H>Shop</H>
      {rewards.length === 0 && <Note>Add a few real-life rewards: a coffee out, an evening off, the thing you have been eyeing. Until then, drops arrive as pouches of sparks.</Note>}
      {TIERS.map((tier) => {
        const list = rewards.filter((r) => r.tier === tier);
        if (!list.length) return null;
        return (
          <Card key={tier}>
            <Text style={s.tier}>
              {TIER_LABEL[tier].toUpperCase()} · {PRICE[tier]} ✨
            </Text>
            {list.map((r) => (
              <View key={r.id} style={s.shopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{r.name}</Text>
                  <ConfirmBtn left label="Remove" confirm="Tap again to remove" onConfirm={() => act((d) => A.removeReward(d, r.id))} />
                </View>
                <Btn
                  small
                  kind={balance >= PRICE[tier] ? 'primary' : 'quiet'}
                  disabled={balance < PRICE[tier]}
                  label={balance >= PRICE[tier] ? 'Buy' : `${PRICE[tier] - balance} to go`}
                  onPress={() => act((d) => A.buyReward(d, r.id))}
                />
              </View>
            ))}
          </Card>
        );
      })}
      <Btn kind="outline" label="+ New reward" onPress={() => open({ type: 'reward' })} />

      {history.length > 0 && (
        <>
          <H>Enjoyed</H>
          <Card>
            {history.map((l) => (
              <View key={l.id} style={s.histRow}>
                <Text style={s.hist} numberOfLines={1}>
                  {l.rewardId ? TIER_ICON[l.tier] : '✨'} {l.name}
                </Text>
                <Text style={s.meta}>{new Date(l.redeemedAt!).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  balance: { color: c.spark, fontSize: 18, fontWeight: '800' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, borderLeftWidth: 3, borderLeftColor: c.spark },
  name: { color: c.text, fontSize: 16, fontWeight: '600' },
  meta: { color: c.dim, fontSize: 13 },
  tier: { color: c.dim, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, minHeight: 32 },
  hist: { color: c.dim, fontSize: 15, flexShrink: 1 },
});
