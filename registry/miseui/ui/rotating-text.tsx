import type * as React from "react"
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { AnimatePresence, animate, motion, useInView, useMotionValue, useReducedMotion, type AnimationPlaybackControls } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { CELL_CLASS, RotatingWord, SLOT_CLASS, SizerLetters, type RotatingTextVariant } from "@/registry/miseui/ui/rotating-text-word"
import { cn } from "@/registry/miseui/lib/utils"

type RotatingTextEffect = "letters"
type RotatingTextTag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div"

const DEFAULT_INTERVAL_MS = 2600
/** Below this a change is still running when the next one starts, and nobody finishes reading a word. */
const MIN_INTERVAL_MS = 1200

function nextWordIndex(index: number, count: number) {
  return count > 0 ? (index + 1) % count : 0
}

function clampInterval(milliseconds: number) {
  return Number.isFinite(milliseconds) ? Math.max(MIN_INTERVAL_MS, milliseconds) : DEFAULT_INTERVAL_MS
}

/** What assistive tech hears: every word once, so nothing depends on which one was showing when it got there. */
function spokenSentence(before: string, words: readonly string[], after: string) {
  return `${before}${words.join(", ")}${after}`
}

const subscribeToVisibility = (onChange: () => void) => {
  document.addEventListener("visibilitychange", onChange)
  return () => document.removeEventListener("visibilitychange", onChange)
}

function useTabVisible() {
  return useSyncExternalStore(
    subscribeToVisibility,
    () => !document.hidden,
    () => true,
  )
}

/** A timer rather than a frame loop: it only ticks when the word changes, and one tick costs one small render. */
function useWordCycle(count: number, intervalMs: number, running: boolean) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (!running || count < 2) return
    const timer = setInterval(() => setIndex((current) => nextWordIndex(current, count)), clampInterval(intervalMs))
    return () => clearInterval(timer)
  }, [running, count, intervalMs])
  return count > 0 ? index % count : 0
}

/**
 * Measures through a ResizeObserver, so a web font arriving late corrects the slot too. Border box sizes ignore
 * transforms on ancestors, which a bounding rect would not.
 */
function useSlotWidth() {
  const width = useMotionValue<number | string>("auto")
  const observer = useRef<ResizeObserver | null>(null)
  const spring = useRef<AnimationPlaybackControls | null>(null)
  const placed = useRef(false)
  const sizerRef = useCallback(
    (element: HTMLSpanElement | null) => {
      observer.current?.disconnect()
      spring.current?.stop()
      if (!element) return
      const next = new ResizeObserver(([entry]) => {
        const measured = Math.ceil(entry?.borderBoxSize?.[0]?.inlineSize ?? element.getBoundingClientRect().width)
        // The first measurement only places the slot. Later ones are a word changing, and start from wherever the spring has got to.
        if (!placed.current) {
          placed.current = true
          width.set(measured)
          return
        }
        spring.current?.stop()
        spring.current = animate(width, measured, SPRING_DEFAULT)
      })
      next.observe(element)
      observer.current = next
    },
    [width],
  )
  return { width, sizerRef }
}

interface SlotProps {
  word: string
  variant: RotatingTextVariant
  byLetter: boolean
  index: number
}

function WordSlot({ word, variant, byLetter, index }: SlotProps) {
  const { width, sizerRef } = useSlotWidth()
  return (
    <motion.span
      data-slot="rotating-text-slot"
      className={cn("relative inline-block max-w-full align-baseline whitespace-nowrap", SLOT_CLASS[variant])}
      style={{ width }}
    >
      <span ref={sizerRef} data-slot="rotating-text-sizer" className={cn("invisible inline-block", CELL_CLASS[variant])}>
        {byLetter ? <SizerLetters word={word} /> : word}
      </span>
      <AnimatePresence initial={false}>
        <RotatingWord key={`${index}:${word}`} word={word} variant={variant} byLetter={byLetter} />
      </AnimatePresence>
    </motion.span>
  )
}

type RotatingTextProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  /** The words that take turns. The first one is what reduced motion and the first paint show. */
  words: readonly string[]
  /** Text before the word, with its own trailing space if the language wants one. */
  before?: string
  /** Text after the word, with its own leading space if the language wants one. */
  after?: string
  as?: RotatingTextTag
  /** `slide` up and out behind a mask, `blur` cross-fades through focus, `flip` turns on the X axis, `pill` a chip whose width springs. */
  variant?: RotatingTextVariant
  /** `letters` staggers the change letter by letter. */
  effect?: RotatingTextEffect
  /** Milliseconds each word stays. Never below 1200. */
  interval?: number
  /** Holds the current word. Tie it to a pause button: motion past five seconds needs a way to stop it. */
  paused?: boolean
}

function RotatingText({ words, before = "", after = "", as: Tag = "span", variant = "slide", effect, interval = DEFAULT_INTERVAL_MS, paused = false, className, onPointerEnter, onPointerLeave, onFocus, onBlur, ...props }: RotatingTextProps) {
  const reduceMotion = useReducedMotion() ?? false
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref)
  const tabVisible = useTabVisible()
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const running = !reduceMotion && !paused && inView && tabVisible && !hovered && !focused
  const index = useWordCycle(words.length, interval, running)
  const word = words[index] ?? ""
  const root = { ...props, "data-slot": "rotating-text", "data-variant": variant, "data-effect": effect, "data-running": running ? "true" : "false" }
  const handlers = {
    onPointerEnter: (event: React.PointerEvent<HTMLElement>) => {
      setHovered(true)
      onPointerEnter?.(event)
    },
    onPointerLeave: (event: React.PointerEvent<HTMLElement>) => {
      setHovered(false)
      onPointerLeave?.(event)
    },
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      setFocused(true)
      onFocus?.(event)
    },
    onBlur: (event: React.FocusEvent<HTMLElement>) => {
      setFocused(false)
      onBlur?.(event)
    },
  }
  return (
    <Tag {...root} {...handlers} className={cn("relative", className)}>
      <span className="sr-only select-none">{spokenSentence(before, words, after)}</span>
      <span ref={ref} aria-hidden="true" data-slot="rotating-text-visual">
        {before}
        {reduceMotion ? (
          <span data-slot="rotating-text-still" className={cn("inline-block max-w-full whitespace-nowrap", SLOT_CLASS[variant], CELL_CLASS[variant])}>
            {words[0] ?? ""}
          </span>
        ) : (
          <WordSlot word={word} variant={variant} byLetter={effect === "letters"} index={index} />
        )}
        {after}
      </span>
    </Tag>
  )
}

export { RotatingText, clampInterval, nextWordIndex, spokenSentence, type RotatingTextProps, type RotatingTextVariant, type RotatingTextEffect }
