import { noiseGlyph } from "@/registry/miseui/ui/scramble-math"
import { splitText } from "@/registry/miseui/ui/split-text-math"

type DecryptTextVariant = "dots" | "redact" | "cipher" | "scan"

const DOT = "•"
const LETTER_STEP_MS: Record<"dots" | "cipher", number> = { dots: 38, cipher: 46 }
/** A long sentence must not still be decoding when someone starts reading it. */
const MAX_WAVE_MS = 900
const WORD_STEP_MS = 170
const MAX_WORD_WAVE_MS = 800
const RETRACT_MS = 280
const SCAN_MS = 900
const MARK_MS = 200
/** Stiffness that lands within 0.3% of the end at progress 1. */
const SPRING_RATE = 8

/** A paint at a negative time is the encrypted state. */
const BEFORE_START = -1

interface DecryptCell {
  target: string
  index: number
  /** What sits in the cell until it is decoded. */
  before: string
  settleAt: number
}

interface DecryptWord {
  key: string
  text: string
  /** When its bar begins to retract. */
  startAt: number
  cells: readonly DecryptCell[]
}

interface DecryptPlan {
  words: readonly DecryptWord[]
  durationMs: number
}

function waveStep(stepMs: number, maxMs: number, count: number) {
  return count > 1 ? Math.min(stepMs, maxMs / (count - 1)) : 0
}

/** Redact goes by word and scan by position on screen, so only the two letter-by-letter variants have a time per letter. */
function letterSettle(variant: DecryptTextVariant, index: number, count: number) {
  if (variant !== "dots" && variant !== "cipher") return 0
  return Math.round(index * waveStep(LETTER_STEP_MS[variant], MAX_WAVE_MS, count))
}

function planDuration(variant: DecryptTextVariant, words: readonly DecryptWord[]) {
  const cells = words.flatMap((word) => word.cells)
  if (variant === "redact") return (words.at(-1)?.startAt ?? 0) + RETRACT_MS
  if (variant === "scan") return SCAN_MS
  return (cells.at(-1)?.settleAt ?? 0) + (variant === "cipher" ? MARK_MS : 0)
}

function decryptPlan(text: string, variant: DecryptTextVariant, seed: number): DecryptPlan {
  const split = splitText(text, "chars")
  const count = split.reduce((sum, word) => sum + word.pieces.length, 0)
  const wordStep = waveStep(WORD_STEP_MS, MAX_WORD_WAVE_MS, split.length)
  const words = split.map((word, position) => ({
    key: word.key,
    text: word.pieces.map((piece) => piece.text).join(""),
    startAt: Math.round(position * wordStep),
    cells: word.pieces.map((piece) => ({
      target: piece.text,
      index: piece.index,
      before: variant === "dots" ? DOT : noiseGlyph(piece.text, { set: "letters", seed, index: piece.index, tick: 0 }),
      settleAt: letterSettle(variant, piece.index, count),
    })),
  }))
  return { words, durationMs: planDuration(variant, words) }
}

/** Closed form of a critically damped spring, the same no-overshoot settle as SPRING_DEFAULT, for a value painted by hand. */
function springProgress(progress: number) {
  if (progress <= 0) return 0
  if (progress >= 1) return 1
  return 1 - (1 + SPRING_RATE * progress) * Math.exp(-SPRING_RATE * progress)
}

/** 1 is a whole bar, 0 is gone. */
function barScale(startAt: number, elapsed: number) {
  return 1 - springProgress((elapsed - startAt) / RETRACT_MS)
}

/** Full at the moment a letter locks, then gone. */
function markOpacity(settleAt: number, elapsed: number) {
  if (elapsed < settleAt || elapsed >= settleAt + MARK_MS) return 0
  return 1 - (elapsed - settleAt) / MARK_MS
}

/** Linear on purpose: a scanner moves at one speed, and easing would bunch up the letters at the ends. */
function scanProgress(elapsed: number) {
  return Math.min(1, Math.max(0, elapsed / SCAN_MS))
}

/** Where each cell sits across the block, 0 to 1. Wrapped lines all scan together. Falls back to reading order with no layout. */
function scanFractions(rects: readonly { left: number; width: number }[], blockLeft: number, blockWidth: number) {
  if (blockWidth <= 0) return rects.map((_, index) => (rects.length > 1 ? index / (rects.length - 1) : 0))
  return rects.map((rect) => Math.min(1, Math.max(0, (rect.left + rect.width / 2 - blockLeft) / blockWidth)))
}

export {
  BEFORE_START,
  DOT,
  MARK_MS,
  barScale,
  decryptPlan,
  markOpacity,
  scanFractions,
  scanProgress,
  springProgress,
  type DecryptCell,
  type DecryptPlan,
  type DecryptTextVariant,
  type DecryptWord,
}
