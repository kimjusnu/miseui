import { splitText } from "@/registry/miseui/ui/split-text-math"

const DEFAULT_STEP_MS = 42
/** A staged sentence should not keep someone waiting, so long text types faster instead of longer. */
const MAX_TYPING_MS = 2600
const SENTENCE_PAUSE_MS = 260
const CLAUSE_PAUSE_MS = 130
const HOLD_MS = 1800
const GAP_MS = 260
const DELETE_STEP_MS = 16
const MAX_DELETE_MS = 420
/** About one blink a second, like a real text caret, and well under the three-flash limit. */
const BLINK_MS = 530
/** On, off, on, then gone. */
const CARET_LINGER_MS = BLINK_MS * 3

const SENTENCE_END = /[.!?…。！？]/
const CLAUSE_END = /[,;:、，]/

interface TypingOptions {
  seed: number
  stepMs?: number
}

interface TypingSegment {
  glyphs: readonly string[]
  /** When each glyph appears, measured from the start of this phrase. */
  schedule: readonly number[]
  startAt: number
  typedAt: number
  heldAt: number
  deletedAt: number
  endAt: number
}

interface TypingTimeline {
  segments: readonly TypingSegment[]
  totalMs: number
  loop: boolean
}

interface TypingFrame {
  phrase: number
  count: number
  /** 1 shows the caret, 0 hides it. */
  caret: 0 | 1
  /** A run that does not loop is over and needs no more frames. */
  done: boolean
}

function typingUnit(seed: number, index: number) {
  const mixed = Math.imul((seed + 1) ^ Math.imul(index + 1, 0x9e3779b1), 0xc2b2ae3d)
  return (((mixed ^ (mixed >>> 15)) >>> 0) % 1000) / 1000
}

/** Graphemes with the spaces kept, so a Hangul syllable or an emoji family arrives as one keystroke. */
function typingGlyphs(text: string): readonly string[] {
  const words = splitText(text, "chars")
  return words.flatMap((word, position) => {
    const pieces = word.pieces.map((piece) => piece.text)
    return position < words.length - 1 ? [...pieces, " "] : pieces
  })
}

/** Pause after a glyph: people stop at punctuation and hesitate between words, and no two keystrokes are the same. */
function keyGap(previous: string, index: number, { seed, stepMs = DEFAULT_STEP_MS }: TypingOptions) {
  const jitter = stepMs * (0.6 + 0.8 * typingUnit(seed, index))
  if (SENTENCE_END.test(previous)) return jitter + SENTENCE_PAUSE_MS
  if (CLAUSE_END.test(previous)) return jitter + CLAUSE_PAUSE_MS
  return previous === " " ? jitter + stepMs * 0.5 : jitter
}

/** The first glyph lands at once, so the very first frame already shows text. */
function typingSchedule(glyphs: readonly string[], options: TypingOptions): readonly number[] {
  const raw = glyphs.reduce<readonly number[]>((times, _, index) => {
    if (index === 0) return [0]
    return [...times, times[index - 1] + keyGap(glyphs[index - 1], index, options)]
  }, [])
  const last = raw.at(-1) ?? 0
  const scale = last > MAX_TYPING_MS ? MAX_TYPING_MS / last : 1
  return raw.map((time) => Math.round(time * scale))
}

function countAt(schedule: readonly number[], elapsed: number) {
  const next = schedule.findIndex((time) => time > elapsed)
  return next === -1 ? schedule.length : next
}

function deleteStep(count: number) {
  return count > 0 ? Math.min(DELETE_STEP_MS, MAX_DELETE_MS / count) : 0
}

function typingTimeline(phrases: readonly string[], options: TypingOptions, loop: boolean): TypingTimeline {
  const segments = phrases.reduce<readonly TypingSegment[]>((built, phrase, index) => {
    const glyphs = typingGlyphs(phrase)
    const schedule = typingSchedule(glyphs, { ...options, seed: options.seed + index })
    const startAt = built.at(-1)?.endAt ?? 0
    const typedAt = startAt + (schedule.at(-1) ?? 0)
    const heldAt = typedAt + HOLD_MS
    const deletedAt = heldAt + glyphs.length * deleteStep(glyphs.length)
    return [...built, { glyphs, schedule, startAt, typedAt, heldAt, deletedAt, endAt: deletedAt + GAP_MS }]
  }, [])
  return { segments, totalMs: segments.at(-1)?.endAt ?? 0, loop }
}

function blink(idleMs: number): 0 | 1 {
  return Math.floor(idleMs / BLINK_MS) % 2 === 0 ? 1 : 0
}

function onceFrame(segment: TypingSegment, elapsed: number): TypingFrame {
  const idle = elapsed - segment.typedAt
  const count = countAt(segment.schedule, elapsed)
  if (idle <= 0) return { phrase: 0, count, caret: 1, done: false }
  if (idle >= CARET_LINGER_MS) return { phrase: 0, count, caret: 0, done: true }
  return { phrase: 0, count, caret: blink(idle), done: false }
}

function loopFrame(segments: readonly TypingSegment[], clock: number): TypingFrame {
  const phrase = Math.max(0, segments.findIndex((segment) => clock < segment.endAt))
  const segment = segments[phrase]
  const { glyphs, schedule, startAt, typedAt, heldAt, deletedAt } = segment
  if (clock <= typedAt) return { phrase, count: countAt(schedule, clock - startAt), caret: 1, done: false }
  if (clock < heldAt) return { phrase, count: glyphs.length, caret: blink(clock - typedAt), done: false }
  if (clock < deletedAt) {
    const removed = Math.floor((clock - heldAt) / deleteStep(glyphs.length))
    return { phrase, count: Math.max(0, glyphs.length - removed), caret: 1, done: false }
  }
  return { phrase, count: 0, caret: 1, done: false }
}

/** What to show at a moment. Pure, so the whole cadence is testable without a frame. */
function typingFrame(timeline: TypingTimeline, clock: number): TypingFrame {
  if (!timeline.loop) return onceFrame(timeline.segments[0], clock)
  return loopFrame(timeline.segments, timeline.totalMs > 0 ? clock % timeline.totalMs : 0)
}

export { BLINK_MS, CARET_LINGER_MS, DEFAULT_STEP_MS, MAX_TYPING_MS, countAt, typingFrame, typingGlyphs, typingSchedule, typingTimeline, type TypingFrame, type TypingTimeline }
