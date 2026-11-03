import { between, seededRandom } from "@/registry/miseui/ui/background-seed"

/** A beam this strong over the page keeps muted text at 4.5:1 in all five palettes, in both themes. */
export const MAX_WASH_OPACITY = 0.18

const RAY_COUNT = 7
const RAY_FAN_DEGREES = 88
const COLUMN_COUNT = 13

export interface Ray {
  /** Degrees from straight down. */
  angle: number
  spread: number
  peak: number
  seconds: number
  delay: number
}

export interface Travel {
  axis: "x" | "y"
  /** Percent of the box. CSS rounds it down onto the grid. */
  at: number
  seconds: number
  delay: number
  peak: number
  /** Translate percent for the frozen frame, chosen so the light is inside the box. */
  still: number
}

export interface Column {
  left: number
  top: number
  width: number
  height: number
  from: number
  to: number
  seconds: number
  delay: number
  peak: number
}

export function rayLayout(seed: number): readonly Ray[] {
  const random = seededRandom(seed)
  return Array.from({ length: RAY_COUNT }, (_, index) => {
    const seconds = between(random, 8, 14)
    return {
      angle: between(random, -3, 3) + (index / (RAY_COUNT - 1) - 0.5) * RAY_FAN_DEGREES,
      spread: between(random, 2.5, 5.5),
      peak: between(random, 0.09, 0.18),
      seconds,
      delay: -between(random, 0, seconds),
    }
  })
}

/** One soft wedge. Conic, so wedges never overlap into a hot core where a stack of bars would. */
export function rayGradient({ angle, spread }: Ray) {
  const start = Math.round((180 + angle - spread) * 100) / 100
  return `conic-gradient(from ${start}deg at 50% -12%, transparent 0deg, var(--mise-light) ${spread}deg, transparent ${spread * 2}deg)`
}

function travelsOn(axis: Travel["axis"], slots: readonly number[], random: () => number): readonly Travel[] {
  return slots.map((slot) => {
    const seconds = between(random, 11, 18)
    return {
      axis,
      at: slot + between(random, -6, 6),
      seconds,
      delay: -between(random, 0, seconds),
      peak: between(random, 0.55, 0.8),
      still: -between(random, 15, 70),
    }
  })
}

export function travelLayout(seed: number): readonly Travel[] {
  const random = seededRandom(seed)
  return [...travelsOn("x", [24, 52, 80], random), ...travelsOn("y", [18, 50, 82], random)]
}

export function columnLayout(seed: number): readonly Column[] {
  const random = seededRandom(seed)
  return Array.from({ length: COLUMN_COUNT }, (_, index) => {
    const height = between(random, 38, 82)
    const seconds = between(random, 10, 18)
    const reach = between(random, 3, 7)
    return {
      left: 3 + ((index + 0.5) / COLUMN_COUNT) * 94 + between(random, -1.5, 1.5),
      top: between(random, 4, 96 - height),
      width: between(random, 2.5, 6),
      height,
      from: -reach,
      to: reach,
      seconds,
      delay: -between(random, 0, seconds),
      peak: between(random, 0.07, 0.18),
    }
  })
}
