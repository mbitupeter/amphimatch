/**
 * Small deterministic PRNG (mulberry32). Given the same seed it always
 * produces the same sequence, which lets the mock model behave like a real
 * one: identical uploads yield identical predictions.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Derives a 32-bit seed from a hex digest (e.g. SHA-256). */
export function seedFromHex(hex: string): number {
  return parseInt(hex.slice(0, 8), 16) >>> 0;
}

export function randomSeed(): number {
  return (Math.random() * 4294967296) >>> 0;
}

/** Fisher–Yates shuffle using the provided RNG; returns a new array. */
export function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
