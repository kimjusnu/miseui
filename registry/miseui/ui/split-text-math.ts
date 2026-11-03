import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"

type SplitBy = "chars" | "words"
type SplitOrigin = "start" | "center"

/** What one piece looks like before and after. A new text effect is one more entry here. */
interface SplitPreset {
  hidden: Record<string, string | number>
  shown: Record<string, string | number>
  /** Clip each piece to its own line box, so it comes out from behind an edge instead of fading through the text above. */
  masked: boolean
  transition: typeof SPRING_DEFAULT
}

const SPLIT_PRESETS = {
  rise: {
    hidden: { y: "110%" },
    shown: { y: "0%" },
    masked: true,
    transition: { ...SPRING_DEFAULT, duration: 0.6 },
  },
  fade: {
    hidden: { opacity: 0 },
    shown: { opacity: 1 },
    masked: false,
    transition: { ...SPRING_DEFAULT, duration: 0.5 },
  },
  blur: {
    hidden: { opacity: 0, filter: "blur(8px)" },
    shown: { opacity: 1, filter: "blur(0px)" },
    masked: false,
    transition: { ...SPRING_DEFAULT, duration: 0.6 },
  },
} as const satisfies Record<string, SplitPreset>

type SplitTextVariant = keyof typeof SPLIT_PRESETS

const STEP_MS: Record<SplitBy, number> = { chars: 24, words: 70 }
/** A headline must not still be arriving when someone starts reading, so the wave has a ceiling. */
const MAX_WAVE_MS = 700

interface SplitPiece {
  text: string
  /** Position among all pieces of the text. */
  index: number
}

interface SplitWord {
  key: string
  pieces: readonly SplitPiece[]
}

/** Graphemes, so a Hangul syllable with combining marks or an emoji family stays one piece. */
function toGraphemes(word: string) {
  if (typeof Intl.Segmenter !== "function") return Array.from(word)
  return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(word), (part) => part.segment)
}

function splitText(text: string, by: SplitBy): readonly SplitWord[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  return words.reduce<{ result: readonly SplitWord[]; next: number }>(
    ({ result, next }, word, position) => {
      const parts = by === "words" ? [word] : toGraphemes(word)
      const pieces = parts.map((part, offset) => ({ text: part, index: next + offset }))
      return { result: [...result, { key: `${word}-${position}`, pieces }], next: next + parts.length }
    },
    { result: [], next: 0 },
  ).result
}

function pieceCount(words: readonly SplitWord[]) {
  return words.reduce((sum, word) => sum + word.pieces.length, 0)
}

/** Milliseconds before a piece starts. `center` runs outward, which suits a centred headline. */
function pieceDelay(index: number, count: number, by: SplitBy, origin: SplitOrigin) {
  const distance = origin === "center" ? Math.abs(index - (count - 1) / 2) : index
  const reach = origin === "center" ? (count - 1) / 2 : count - 1
  const step = reach > 0 ? Math.min(STEP_MS[by], MAX_WAVE_MS / reach) : 0
  return Math.round(distance * step)
}

export { SPLIT_PRESETS, pieceCount, pieceDelay, splitText, type SplitBy, type SplitOrigin, type SplitPiece, type SplitPreset, type SplitTextVariant, type SplitWord }
