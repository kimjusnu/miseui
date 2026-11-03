/** Mulberry32. Server and client walk the same numbers, so a seeded layout hydrates without a mismatch. */
export function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let mixed = state
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

/** Two decimals: enough for a percent or a second, and short in the inline style. */
export function between(random: () => number, min: number, max: number) {
  return Math.round((min + random() * (max - min)) * 100) / 100
}
