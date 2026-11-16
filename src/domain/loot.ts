import type { Dread, LootItem, Reward, Tier } from './types';
import { newId } from './types';

// Tier is the only thing you declare about a reward. It sets the shop price
// and how rarely it drops.
export const PRICE: Record<Tier, number> = { small: 30, medium: 100, big: 300 };
export const TIER_LABEL: Record<Tier, string> = { small: 'Small treat', medium: 'Proper treat', big: 'Big reward' };
export const TIER_ICON: Record<Tier, string> = { small: '🍪', medium: '🎁', big: '👑' };

// Loot is occasional, not constant, so it stays a surprise instead of a wage.
export const BASE_DROP = 0.06;
export const MAX_DROP = 0.15;

export function dropChance(o: { dread: Dread; stubbornDays: number; streak: number }): number {
  const chance = BASE_DROP + o.dread * 0.02 + (o.stubbornDays > 0 ? 0.03 : 0) + (o.streak >= 7 ? 0.02 : 0);
  return Math.min(MAX_DROP, chance);
}

const TIER_ORDER: Tier[] = ['big', 'medium', 'small'];

/** Maybe drop something. `rng` is injectable so this is testable. */
export function rollDrop(rewards: Reward[], chance: number, now: Date, completionId: string, rng: () => number = Math.random): LootItem | null {
  if (rng() >= chance) return null;
  const r = rng();
  const rolled: Tier = r < 0.05 ? 'big' : r < 0.3 ? 'medium' : 'small';
  const live = rewards.filter((x) => !x.archivedAt);
  // Fall back only to lesser tiers, so big rewards stay rare.
  for (const tier of TIER_ORDER.slice(TIER_ORDER.indexOf(rolled))) {
    const pool = live.filter((x) => x.tier === tier);
    if (pool.length) {
      const pick = pool[Math.floor(rng() * pool.length)];
      return { id: newId(), rewardId: pick.id, name: pick.name, tier, source: 'drop', sparksDelta: 0, at: now.toISOString(), redeemedAt: null, completionId };
    }
  }
  const sparks = 5 + Math.floor(rng() * 16);
  return {
    id: newId(),
    rewardId: null,
    name: `Pouch of ${sparks} sparks`,
    tier: 'small',
    source: 'drop',
    sparksDelta: sparks,
    at: now.toISOString(),
    redeemedAt: now.toISOString(),
    completionId,
  };
}
