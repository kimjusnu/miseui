type GlitchTextVariant = "split" | "slice" | "flicker" | "skew"

/** One held pose. Offsets are in em so the burst scales with the type. */
interface GlitchFrame {
  at: number
  fringe: number
  /** Sideways shift of each band. */
  bands: readonly number[]
  /** Letters that have dropped out. */
  off: readonly number[]
  skew: number
  shift: number
}

interface GlitchBurst {
  frames: readonly GlitchFrame[]
  durationMs: number
}

/** Top and bottom of each band, in percent. They overlap a hair so a seam never shows between them. */
const BANDS = [
  [0, 28],
  [27.5, 53],
  [52.5, 79],
  [78.5, 100],
] as const

/** Start to start. With at most three drop-outs per burst, no second can hold more than three flashes (WCAG 2.3.1). */
const MIN_REPLAY_MS = 1000
const FLICKER_OFF_RATIO = [0.45, 0.25, 0.6] as const
const FLICKER_TIMES = [0, 70, 170, 260, 420, 520] as const
const FLICKER_END_MS = 640

function glitchUnit(seed: number, a: number, b = 0) {
  const mixed = Math.imul((seed + 1) ^ Math.imul(a + 1, 0x9e3779b1) ^ Math.imul(b + 1, 0x85ebca77), 0xc2b2ae3d)
  return (((mixed ^ (mixed >>> 15)) >>> 0) % 10000) / 10000
}

function signed(seed: number, a: number, b = 0) {
  return glitchUnit(seed, a, b) < 0.5 ? -1 : 1
}

const CLEAN: Omit<GlitchFrame, "at"> = { fringe: 0, bands: [0, 0, 0, 0], off: [], skew: 0, shift: 0 }

function round(value: number) {
  return Math.round(value * 1000) / 1000
}

function splitBurst(seed: number): GlitchBurst {
  const sizes = [0.05, 0.022, 0.07, 0.03, 0.014]
  const frames = sizes.map((size, index) => ({ ...CLEAN, at: index * 70, fringe: round(size * signed(seed, index)) }))
  return { frames, durationMs: sizes.length * 70 }
}

function sliceBurst(seed: number): GlitchBurst {
  const moves = [2, 2, 1, 2, 1, 0]
  const frames = moves.map((count, index) => {
    const pick = Math.floor(glitchUnit(seed, index, 9) * BANDS.length)
    const bands = BANDS.map((_, band) => {
      const hit = (band - pick + BANDS.length) % BANDS.length < count
      return hit ? round((0.05 + glitchUnit(seed, index, band) * 0.11) * signed(seed, index, band)) : 0
    })
    return { ...CLEAN, at: index * 60, bands }
  })
  return { frames, durationMs: moves.length * 60 }
}

/** Off frames alternate with clean ones, so a letter can drop out at most three times in a burst. */
function flickerBurst(seed: number, letterCount: number): GlitchBurst {
  const frames = FLICKER_TIMES.map((at, index) => {
    if (index % 2 === 1) return { ...CLEAN, at }
    const ratio = FLICKER_OFF_RATIO[index / 2]
    const off = Array.from({ length: letterCount }, (_, letter) => letter).filter((letter) => glitchUnit(seed, letter, index) < ratio)
    return { ...CLEAN, at, off }
  })
  return { frames, durationMs: FLICKER_END_MS }
}

function skewBurst(seed: number): GlitchBurst {
  const direction = signed(seed, 0)
  const poses = [
    [8, 0.03],
    [-5, -0.02],
    [3, 0.014],
    [-2, -0.008],
  ]
  const frames = poses.map(([skew, shift], index) => ({ ...CLEAN, at: index * 65, skew: skew * direction, shift: shift * direction }))
  return { frames, durationMs: poses.length * 65 }
}

function glitchBurst(variant: GlitchTextVariant, seed: number, letterCount: number): GlitchBurst {
  if (variant === "split") return splitBurst(seed)
  if (variant === "slice") return sliceBurst(seed)
  if (variant === "flicker") return flickerBurst(seed, letterCount)
  return skewBurst(seed)
}

/** The pose held at a moment, or null once the text is clean again. Stepped by design: nothing tweens between frames. */
function frameAt(burst: GlitchBurst, elapsed: number) {
  if (elapsed >= burst.durationMs) return null
  return burst.frames.reduce<GlitchFrame | null>((held, frame) => (frame.at <= elapsed ? frame : held), null)
}

/** How many times a letter goes from lit to dropped within a burst. */
function dropOuts(burst: GlitchBurst, letter: number) {
  return burst.frames.filter((frame) => frame.off.includes(letter)).length
}

export { BANDS, MIN_REPLAY_MS, dropOuts, frameAt, glitchBurst, type GlitchBurst, type GlitchFrame, type GlitchTextVariant }
