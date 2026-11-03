import type * as React from "react"
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { useInView, useReducedMotion } from "motion/react"
import { cellGlyph, scrambleDuration, scrambleWords, type ScrambleMode, type ScrambleWord } from "@/registry/miseui/ui/scramble-math"
import { GlyphCell, WordRow, glyphCells, paintGlyph, useReplayHost, useTimeline, type FramePainter } from "@/registry/miseui/ui/scramble-play"
import type { SplitOrigin } from "@/registry/miseui/ui/split-text-math"
import { cn } from "@/registry/miseui/lib/utils"

type ScrambleTextVariant = "letters" | "mono" | "center" | "ticker"
type ScrambleTextEffect = "hover"
type ScrambleTextTrigger = "view" | "mount"
type ScrambleTextTag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div"

const DEFAULT_SEED = 7
const VIEW_MARGIN = "0px 0px -10% 0px"

const VARIANT_PLAN: Record<ScrambleTextVariant, { mode: ScrambleMode; order: SplitOrigin }> = {
  letters: { mode: "letters", order: "start" },
  mono: { mode: "symbols", order: "start" },
  center: { mode: "letters", order: "center" },
  ticker: { mode: "ticker", order: "start" },
}

function createPainter(visual: HTMLElement, words: readonly ScrambleWord[], mode: ScrambleMode, seed: number): FramePainter {
  const nodes = glyphCells(visual)
  const cells = words.flatMap((word) => word.cells)
  const duration = scrambleDuration(words)
  return (elapsed) => {
    cells.forEach((cell, position) => paintGlyph(nodes[position], cellGlyph(cell, elapsed, mode, seed)))
    return elapsed >= duration
  }
}

type ScrambleTextProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  text: string
  /** The element to render. A heading stays a heading. */
  as?: ScrambleTextTag
  /** `letters` same-case noise in the text's own face, `mono` symbols in a monospace face, `center` settles from the middle out, `ticker` each letter steps through the alphabet in order. */
  variant?: ScrambleTextVariant
  /** `hover` stays still until hovered or focused, for a link. Listens on the nearest link or button around it. */
  effect?: ScrambleTextEffect
  /** `view` plays once when first seen, `mount` plays right away. */
  trigger?: ScrambleTextTrigger
  /** The same seed gives the same noise. */
  seed?: number
}

function ScrambleText({ text, as: Tag = "span", variant = "letters", effect, trigger = "view", seed = DEFAULT_SEED, className, ...props }: ScrambleTextProps) {
  const reduceMotion = useReducedMotion() ?? false
  const visualRef = useRef<HTMLSpanElement>(null)
  const seen = useInView(visualRef, { once: true, margin: VIEW_MARGIN })
  const { play, stop, isRunning } = useTimeline()
  const { mode, order } = VARIANT_PLAN[variant]
  const words = useMemo(() => scrambleWords(text, { mode, order, seed }), [text, mode, order, seed])
  const auto = effect !== "hover" && !reduceMotion
  const due = trigger === "mount" || seen

  // Before paint, so the finished text from the first render never flashes ahead of the noise.
  useLayoutEffect(() => {
    if (auto && visualRef.current) createPainter(visualRef.current, words, mode, seed)(0)
  }, [auto, words, mode, seed])

  useEffect(() => {
    if (!auto || !due || !visualRef.current) return
    play(createPainter(visualRef.current, words, mode, seed))
    return stop
  }, [auto, due, words, mode, seed, play, stop])

  useReplayHost(visualRef, effect === "hover" && !reduceMotion, () => {
    if (visualRef.current && !isRunning()) play(createPainter(visualRef.current, words, mode, seed))
  })

  return (
    <Tag {...props} data-slot="scramble-text" data-variant={variant} data-effect={effect} className={cn("relative", variant === "mono" && "font-mono", className)}>
      {/* Noise read aloud letter by letter would be nonsense, so assistive tech gets the sentence once. */}
      <span className="sr-only select-none">{text}</span>
      <span ref={visualRef} aria-hidden="true" data-slot="scramble-text-visual">
        {/* The key drops a half-played frame. It sits inside the observed element, because useInView keeps watching the node it first got. */}
        <Fragment key={`${variant}:${effect}:${seed}:${reduceMotion}:${text}`}>
          {words.map((word, position) => (
            <WordRow key={word.key} last={position === words.length - 1}>
              {word.cells.map((cell) => (
                <GlyphCell key={cell.index} target={cell.target} layerClassName={variant === "mono" ? "text-muted-foreground" : undefined} />
              ))}
            </WordRow>
          ))}
        </Fragment>
      </span>
    </Tag>
  )
}

export { ScrambleText, type ScrambleTextProps, type ScrambleTextVariant, type ScrambleTextEffect, type ScrambleTextTrigger }
