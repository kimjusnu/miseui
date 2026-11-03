import type * as React from "react"
import { useRef } from "react"
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react"
import { cn } from "@/registry/miseui/lib/utils"

type ScrubTextVariant = "words" | "marker" | "rise"
type ScrubTextEffect = "smooth"

/** Starts as the first line nears the bottom of the view, ends with the last line above the middle. */
const SCRUB_OFFSET = ["start 0.85", "end 0.5"] as const
/** Each word takes this many word-lengths to arrive, so a few are always mid-way and it reads as a wave. */
const WORD_OVERLAP = 4
/** Dim enough to read as unread, bright enough that nobody thinks the text failed to load. */
const DIM_OPACITY = 0.24
/** Critical damping (2 * sqrt(stiffness)) with the 0.35 s response of SPRING_DEFAULT. useSpring takes physics, not a duration. */
const SMOOTH_SPRING = { stiffness: 322, damping: 36, mass: 1, restDelta: 0.001 }
const PAGE_END = 0.999

function splitWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean)
}

/** Where in the 0..1 scroll a word starts and finishes. First starts at 0 and last ends at 1, whatever the length. */
function wordRange(index: number, count: number): [number, number] {
  const span = Math.min(1, WORD_OVERLAP / Math.max(1, count))
  const start = count > 1 ? (index / (count - 1)) * (1 - span) : 0
  return [start, start + span]
}

/** A paragraph near the end of a page may never reach its end offset. Running out of page has to finish it, or it stays dim. */
function settledProgress(progress: number, pageProgress: number) {
  return pageProgress >= PAGE_END ? 1 : progress
}

interface WordProps {
  word: string
  progress: MotionValue<number>
  range: [number, number]
}

function FadeWord({ word, progress, range }: WordProps) {
  const opacity = useTransform(progress, range, [DIM_OPACITY, 1])
  return (
    <>
      <motion.span data-slot="scrub-text-word" style={{ opacity }}>
        {word}
      </motion.span>{" "}
    </>
  )
}

function MarkerWord({ word, progress, range }: WordProps) {
  const backgroundSize = useTransform(progress, range, ["0% 100%", "100% 100%"])
  return (
    // The space stays inside the span so the marker runs through it instead of leaving a gap at every word.
    <motion.span
      data-slot="scrub-text-word"
      className="bg-[linear-gradient(var(--mise-soft),var(--mise-soft))] bg-no-repeat box-decoration-clone"
      style={{ backgroundSize }}
    >
      {word}{" "}
    </motion.span>
  )
}

function RiseWord({ word, progress, range }: WordProps) {
  const opacity = useTransform(progress, range, [0, 1])
  const y = useTransform(progress, range, ["0.5em", "0em"])
  return (
    <>
      <motion.span data-slot="scrub-text-word" className="inline-block" style={{ opacity, y }}>
        {word}
      </motion.span>{" "}
    </>
  )
}

const WORD: Record<ScrubTextVariant, (props: WordProps) => React.JSX.Element> = {
  words: FadeWord,
  marker: MarkerWord,
  rise: RiseWord,
}

const ROOT_CLASS = "min-w-0 text-lg leading-7 font-medium text-pretty"

type ScrubTextProps = Omit<React.ComponentProps<"p">, "children"> & {
  text: string
  /** `words` from dim to full, `marker` a highlight sweeps under them, `rise` each word lifts into place. */
  variant?: ScrubTextVariant
  /** `smooth` eases the progress, so the steps of a mouse wheel do not show. */
  effect?: ScrubTextEffect
  /** The element that scrolls, when it is not the page. It needs `position: relative`. */
  scrollRef?: React.RefObject<HTMLElement | null>
}

function ScrubWords({ text, variant = "words", effect, scrollRef, className, ...props }: ScrubTextProps) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress: passing } = useScroll({ target: ref, container: scrollRef, offset: [...SCRUB_OFFSET] })
  const { scrollYProgress: page } = useScroll({ container: scrollRef })
  const settled = useTransform([passing, page], ([progress, pageProgress]: number[]) => settledProgress(progress, pageProgress))
  const eased = useSpring(settled, SMOOTH_SPRING)
  const progress = effect === "smooth" ? eased : settled
  const words = splitWords(text)
  const Word = WORD[variant]
  return (
    <p ref={ref} data-slot="scrub-text" data-variant={variant} data-effect={effect} className={cn(ROOT_CLASS, className)} {...props}>
      {words.map((word, index) => (
        <Word key={`${word}-${index}`} word={word} progress={progress} range={wordRange(index, words.length)} />
      ))}
    </p>
  )
}

function ScrubText({ scrollRef, ...props }: ScrubTextProps) {
  const reduceMotion = useReducedMotion() ?? false
  if (!reduceMotion) return <ScrubWords scrollRef={scrollRef} {...props} />
  const { text, variant = "words", effect, className, ...rest } = props
  return (
    <p data-slot="scrub-text" data-variant={variant} data-effect={effect} data-reduced="true" className={cn(ROOT_CLASS, className)} {...rest}>
      {text}
    </p>
  )
}

export { ScrubText, settledProgress, splitWords, wordRange, type ScrubTextProps, type ScrubTextVariant, type ScrubTextEffect }
