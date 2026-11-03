import { motion, type Variants } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { pieceDelay, splitText } from "@/registry/miseui/ui/split-text-math"
import { cn } from "@/registry/miseui/lib/utils"

type RotatingTextVariant = "slide" | "blur" | "flip" | "pill"

type WordPose = Record<string, string | number>

interface WordMotion {
  enter: WordPose
  center: WordPose
  exit: WordPose
}

const WORD_MOTION: Record<RotatingTextVariant, WordMotion> = {
  slide: { enter: { y: "110%" }, center: { y: "0%" }, exit: { y: "-110%" } },
  blur: {
    enter: { opacity: 0, filter: "blur(6px)" },
    center: { opacity: 1, filter: "blur(0px)" },
    exit: { opacity: 0, filter: "blur(6px)" },
  },
  flip: { enter: { rotateX: -90 }, center: { rotateX: 0 }, exit: { rotateX: 90 } },
  pill: { enter: { opacity: 0, y: "45%" }, center: { opacity: 1, y: "0%" }, exit: { opacity: 0, y: "-45%" } },
}

/** Long enough to read as a change of word, short enough to be over before the eye has moved on. */
const CHANGE_SECONDS = 0.55

const SLOT_CLASS: Record<RotatingTextVariant, string> = {
  // The extra bottom room keeps descenders inside the clip; the negative margin gives the line height back.
  slide: "overflow-clip pb-[0.14em] -mb-[0.14em]",
  blur: "",
  flip: "[perspective:20em]",
  pill: "overflow-clip rounded-full bg-mise-soft -my-[0.06em]",
}

/** Padding lives on the word and its sizer rather than the slot, so the measured width already includes it. */
const CELL_CLASS: Record<RotatingTextVariant, string> = {
  slide: "",
  blur: "",
  flip: "",
  pill: "px-[0.5em] py-[0.06em]",
}

/** Turning about the centre of a cube half a line behind the text, so it reads as one solid turning over. */
const PIECE_CLASS: Record<RotatingTextVariant, string> = {
  slide: "",
  blur: "",
  flip: "origin-[50%_50%_-0.5lh] backface-hidden",
  pill: "",
}

function pieceVariants(pose: WordMotion, delay: number): Variants {
  const transition = { ...SPRING_DEFAULT, duration: CHANGE_SECONDS, delay }
  return {
    enter: pose.enter,
    center: { ...pose.center, transition },
    exit: { ...pose.exit, transition },
  }
}

interface RotatingWordProps {
  word: string
  variant: RotatingTextVariant
  /** Stagger by letter instead of moving the word as one. */
  byLetter: boolean
}

function RotatingWord({ word, variant, byLetter }: RotatingWordProps) {
  const groups = splitText(word, byLetter ? "chars" : "words")
  const count = groups.reduce((sum, group) => sum + group.pieces.length, 0)
  return (
    <motion.span
      data-slot="rotating-text-word"
      className={cn("absolute start-0 top-0 block whitespace-nowrap", variant === "flip" && "[transform-style:preserve-3d]", CELL_CLASS[variant])}
      initial="enter"
      animate="center"
      exit="exit"
    >
      {groups.map((group, position) => (
        <span key={group.key}>
          {group.pieces.map((piece) => (
            <motion.span
              key={piece.index}
              data-slot="rotating-text-piece"
              className={cn("inline-block", PIECE_CLASS[variant])}
              variants={pieceVariants(WORD_MOTION[variant], byLetter ? pieceDelay(piece.index, count, "chars", "start") / 1000 : 0)}
            >
              {piece.text}
            </motion.span>
          ))}
          {position < groups.length - 1 ? " " : null}
        </span>
      ))}
    </motion.span>
  )
}

/** Split letters lose kerning, so a slot sized from the whole word comes up short and clips the last letter. */
function SizerLetters({ word }: { word: string }) {
  const groups = splitText(word, "chars")
  return groups.map((group, position) => (
    <span key={group.key}>
      {group.pieces.map((piece) => (
        <span key={piece.index} className="inline-block">
          {piece.text}
        </span>
      ))}
      {position < groups.length - 1 ? " " : null}
    </span>
  ))
}

export { CELL_CLASS, RotatingWord, SLOT_CLASS, SizerLetters, type RotatingTextVariant }
