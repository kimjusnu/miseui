import { between, seededRandom } from "@/registry/miseui/ui/background-seed"

export type MeteorsVariant = "meteors" | "rain" | "comets" | "stars"

const DEFAULT_COUNT: Record<MeteorsVariant, number> = { meteors: 8, rain: 26, comets: 3, stars: 36 }
/** The ceilings keep the sky from reading as a fault, whatever the owner passes. */
export const MAX_COUNT: Record<MeteorsVariant, number> = { meteors: 20, rain: 48, comets: 6, stars: 96 }

export interface Streak {
  /** Where it enters, in percent of the box. Can start past the edge. */
  left: number
  top: number
  /** Where it sits in the frozen frame, always inside the box. */
  stillLeft: number
  stillTop: number
  length: number
  travel: number
  angle: number
  seconds: number
  delay: number
  peak: number
  /** Opacity in the frozen frame. */
  stillPeak: number
}

export interface Star {
  left: number
  top: number
  size: number
  seconds: number
  delay: number
  peak: number
}

export function meteorCount(variant: MeteorsVariant, count?: number) {
  if (count === undefined || !Number.isFinite(count)) return DEFAULT_COUNT[variant]
  return Math.min(MAX_COUNT[variant], Math.max(0, Math.round(count)))
}

interface StreakRange {
  left: readonly [number, number]
  top: readonly [number, number]
  length: readonly [number, number]
  travel: readonly [number, number]
  seconds: readonly [number, number]
  peak: readonly [number, number]
  angle: number
}

/** Diagonals enter along the top and, past 100%, down the right side, so the whole box gets crossed. */
const RANGE: Record<Exclude<MeteorsVariant, "stars">, StreakRange> = {
  meteors: { left: [10, 150], top: [-14, -6], length: [56, 96], travel: [560, 760], seconds: [10, 18], peak: [0.55, 0.85], angle: 125 },
  rain: { left: [1, 99], top: [-16, 40], length: [32, 72], travel: [560, 800], seconds: [3.4, 6], peak: [0.14, 0.3], angle: 90 },
  comets: { left: [30, 160], top: [-30, -10], length: [160, 260], travel: [960, 1240], seconds: [20, 32], peak: [0.6, 0.8], angle: 140 },
}

const GLINT: StreakRange = { left: [40, 130], top: [-12, -4], length: [64, 96], travel: [560, 640], seconds: [20, 28], peak: [0.6, 0.8], angle: 125 }

function makeStreak(range: StreakRange, random: () => number): Streak {
  const seconds = between(random, range.seconds[0], range.seconds[1])
  const peak = between(random, range.peak[0], range.peak[1])
  return {
    left: between(random, range.left[0], range.left[1]),
    top: between(random, range.top[0], range.top[1]),
    stillLeft: between(random, 8, 88),
    stillTop: between(random, 8, 84),
    length: between(random, range.length[0], range.length[1]),
    travel: between(random, range.travel[0], range.travel[1]),
    angle: range.angle,
    seconds,
    delay: -between(random, 0, seconds),
    peak,
    stillPeak: peak * 0.8,
  }
}

export function streakLayout(variant: Exclude<MeteorsVariant, "stars">, seed: number, count?: number): readonly Streak[] {
  const random = seededRandom(seed)
  return Array.from({ length: meteorCount(variant, count) }, () => makeStreak(RANGE[variant], random))
}

export function starLayout(seed: number, count?: number): readonly Star[] {
  const random = seededRandom(seed)
  return Array.from({ length: meteorCount("stars", count) }, () => {
    const seconds = between(random, 6, 14)
    return {
      left: between(random, 1, 99),
      top: between(random, 1, 99),
      size: between(random, 1, 2.5),
      seconds,
      delay: -between(random, 0, seconds),
      peak: between(random, 0.3, 0.75),
    }
  })
}

/** The occasional streak over a still sky. One, so it stays an event. */
export function glintLayout(seed: number): Streak {
  return makeStreak(GLINT, seededRandom(seed + 1))
}
