import { pieceCount, pieceDelay, splitText, type SplitOrigin } from "@/registry/miseui/ui/split-text-math"

type GlyphKind = "upper" | "lower" | "digit" | "hangul" | "fixed"
type NoiseSet = "letters" | "symbols"
type ScrambleMode = NoiseSet | "ticker"

/** Glyph churn is capped well under the frame rate: at 60 changes a second letters read as static, not as text settling. */
const NOISE_TICK_MS = 55
const TICKER_STEP_MS = 45
/** How long the first letter stays noise, so even a one-letter text visibly settles. */
const LEAD_MS = 180
const MIN_TICKER_STEPS = 4
const TICKER_STEP_RANGE = 6
const HANGUL_START = 0xac00
const HANGUL_END = 0xd7a3
/** One step of the medial vowel. Stepping one code point only swaps the final consonant, which barely reads as motion. */
const HANGUL_VOWEL_STEP = 28

const ALPHABET: Record<"upper" | "lower" | "digit", string> = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digit: "0123456789",
}

/**
 * A wide glyph in the cell of a narrow letter runs over its neighbours, so narrow letters
 * only draw from narrow glyphs and the very widest (m, w) are left out of the regular pools.
 */
const NOISE_POOL = {
  upper: "ABCDEFGHKNOPRSUVXYZ",
  narrowUpper: "IJLT",
  lower: "abcdeghknopqsuvxyz",
  narrowLower: "fijlrt",
  digit: ALPHABET.digit,
  hangul: "가나다라마바사아자차카타파하고노도로모보소오조호구누두루무부수우주후",
  symbols: "#%&*+=/<>~^-_",
} as const

const NARROW_LETTERS = "fijlrtIJLT"

/** Deterministic value in [0, 1). Same inputs, same glyph, so server and client agree and tests can pin a frame. */
function seededUnit(seed: number, a: number, b = 0) {
  const mixed = Math.imul((seed + 1) ^ Math.imul(a + 1, 0x9e3779b1) ^ Math.imul(b + 1, 0x85ebca77), 0xc2b2ae3d)
  const shifted = Math.imul(mixed ^ (mixed >>> 15), 0x27d4eb2f)
  return ((shifted ^ (shifted >>> 13)) >>> 0) / 4294967296
}

function glyphKind(glyph: string): GlyphKind {
  if (/^[A-Z]$/.test(glyph)) return "upper"
  if (/^[a-z]$/.test(glyph)) return "lower"
  if (/^[0-9]$/.test(glyph)) return "digit"
  if (/^[가-힣]$/.test(glyph)) return "hangul"
  return "fixed"
}

function letterPool(target: string, kind: Exclude<GlyphKind, "fixed">) {
  const narrow = NARROW_LETTERS.includes(target)
  if (kind === "upper") return narrow ? NOISE_POOL.narrowUpper : NOISE_POOL.upper
  if (kind === "lower") return narrow ? NOISE_POOL.narrowLower : NOISE_POOL.lower
  return NOISE_POOL[kind]
}

interface NoiseOptions {
  set: NoiseSet
  seed: number
  index: number
  tick: number
}

/** A stand-in for one letter. Punctuation and emoji are returned as they are: they carry no noise worth showing. */
function noiseGlyph(target: string, { set, seed, index, tick }: NoiseOptions) {
  const kind = glyphKind(target)
  if (kind === "fixed") return target
  const pool = set === "symbols" ? NOISE_POOL.symbols : letterPool(target, kind)
  return pool[Math.floor(seededUnit(seed, index, tick) * pool.length)]
}

/** The glyph `stepsLeft` places before the target in its alphabet, wrapping round. */
function tickerGlyph(target: string, stepsLeft: number) {
  const kind = glyphKind(target)
  if (kind === "fixed") return target
  if (kind === "hangul") {
    const code = target.charCodeAt(0) - HANGUL_VOWEL_STEP * stepsLeft
    return String.fromCharCode(Math.min(HANGUL_END, Math.max(HANGUL_START, code)))
  }
  const alphabet = ALPHABET[kind]
  const position = alphabet.indexOf(target) - stepsLeft
  return alphabet[((position % alphabet.length) + alphabet.length) % alphabet.length]
}

interface ScrambleCell {
  target: string
  index: number
  /** When this cell begins stepping. Only the ticker waits. */
  startAt: number
  /** From this moment the cell shows its real letter. */
  settleAt: number
  /** Alphabet steps the ticker walks. */
  steps: number
}

interface ScrambleWord {
  key: string
  cells: readonly ScrambleCell[]
}

interface ScrambleOptions {
  mode: ScrambleMode
  order: SplitOrigin
  seed: number
}

function planCell(target: string, index: number, wave: number, { mode, seed }: ScrambleOptions): ScrambleCell {
  if (glyphKind(target) === "fixed") return { target, index, startAt: 0, settleAt: 0, steps: 0 }
  if (mode !== "ticker") return { target, index, startAt: 0, settleAt: LEAD_MS + wave, steps: 0 }
  const steps = MIN_TICKER_STEPS + Math.floor(seededUnit(seed, index, -1) * TICKER_STEP_RANGE)
  // Half the wave, because each letter also spends its own steps and the whole must stay short.
  const startAt = Math.round(wave / 2)
  return { target, index, startAt, settleAt: startAt + steps * TICKER_STEP_MS, steps }
}

function scrambleWords(text: string, options: ScrambleOptions): readonly ScrambleWord[] {
  const words = splitText(text, "chars")
  const count = pieceCount(words)
  return words.map((word) => ({
    key: word.key,
    cells: word.pieces.map((piece) => planCell(piece.text, piece.index, pieceDelay(piece.index, count, "chars", options.order), options)),
  }))
}

/** What a cell shows at a moment, or null once it shows its real letter. */
function cellGlyph(cell: ScrambleCell, elapsed: number, mode: ScrambleMode, seed: number) {
  if (elapsed >= cell.settleAt) return null
  if (mode === "ticker") {
    const stepsLeft = elapsed < cell.startAt ? cell.steps : Math.ceil((cell.settleAt - elapsed) / TICKER_STEP_MS)
    return tickerGlyph(cell.target, stepsLeft)
  }
  return noiseGlyph(cell.target, { set: mode, seed, index: cell.index, tick: Math.floor(Math.max(0, elapsed) / NOISE_TICK_MS) })
}

function scrambleDuration(words: readonly ScrambleWord[]) {
  return words.reduce((longest, word) => word.cells.reduce((most, cell) => Math.max(most, cell.settleAt), longest), 0)
}

export {
  cellGlyph,
  glyphKind,
  noiseGlyph,
  scrambleDuration,
  scrambleWords,
  seededUnit,
  tickerGlyph,
  type GlyphKind,
  type NoiseSet,
  type ScrambleCell,
  type ScrambleMode,
  type ScrambleOptions,
  type ScrambleWord,
}
