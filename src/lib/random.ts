export type Rng = () => number;

export const nativeRng: Rng = () => Math.random();

export function createSeededRng(seed: number): Rng {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(rng: Rng, maxExclusive: number): number {
  if (maxExclusive <= 0) return 0;
  return Math.floor(rng() * maxExclusive);
}

export function weightedPick<T>(items: T[], weights: number[], rng: Rng): T {
  if (items.length === 0) {
    throw new Error("weightedPick requires at least one item");
  }
  const total = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
  if (total <= 0) return items[randomInt(rng, items.length)];
  let cursor = rng() * total;
  for (let index = 0; index < items.length; index += 1) {
    cursor -= Math.max(0, weights[index] ?? 0);
    if (cursor <= 0) return items[index];
  }
  return items[items.length - 1];
}
