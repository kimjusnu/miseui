import type * as React from "react"
import { useEffect, useMemo, useRef } from "react"
import { useInView, useReducedMotion } from "motion/react"
import { BANDS, glitchBurst, type GlitchTextVariant } from "@/registry/miseui/ui/glitch-math"
import { useBurst, useHoverReplay } from "@/registry/miseui/ui/glitch-play"
import { splitText } from "@/registry/miseui/ui/split-text-math"
import { cn } from "@/registry/miseui/lib/utils"

type GlitchTextEffect = "hover"
type GlitchTextTrigger = "view" | "mount"
type GlitchTextTag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div"

const DEFAULT_SEED = 3
const VIEW_MARGIN = "0px 0px -10% 0px"
/** Copies of the text exist only for the burst: hidden at rest so find in page counts the sentence once. */
const LAYER = "pointer-events-none invisible absolute inset-0 block select-none"
/** Fixed hues, since the accent may be anything. Multiply on light and screen on dark make the overlap land back on the text colour. */
const FRINGE = "mix-blend-multiply dark:mix-blend-screen"

function FringeLayers({ text }: { text: string }) {
  return (
    <>
      <span aria-hidden="true" data-slot="glitch-text-fringe" className={cn(LAYER, FRINGE, "text-red-500")}>
        {text}
      </span>
      <span aria-hidden="true" data-slot="glitch-text-fringe" className={cn(LAYER, FRINGE, "text-cyan-500")}>
        {text}
      </span>
    </>
  )
}

function BandLayers({ text }: { text: string }) {
  return BANDS.map(([top, bottom]) => (
    <span
      key={top}
      aria-hidden="true"
      data-slot="glitch-text-band"
      className={LAYER}
      // The side insets are open, so a shifted band keeps glyphs that overhang the box.
      style={{ clipPath: `inset(${top}% -1em ${100 - bottom}% -1em)` }}
    >
      {text}
    </span>
  ))
}

function FlickerLetters({ text }: { text: string }) {
  const words = splitText(text, "chars")
  return (
    <span aria-hidden="true" data-slot="glitch-text-visual" className="block">
      {words.map((word, position) => (
        <span key={word.key}>
          <span className="inline-block whitespace-nowrap">
            {word.pieces.map((piece) => (
              <span key={piece.index} data-slot="glitch-text-letter" className="inline-block">
                {piece.text}
              </span>
            ))}
          </span>
          {position < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  )
}

function GlitchBody({ text, variant }: { text: string; variant: GlitchTextVariant }) {
  if (variant === "flicker") {
    return (
      <>
        {/* Letters split apart would be read one by one, so assistive tech gets the sentence once. */}
        <span className="sr-only select-none">{text}</span>
        <FlickerLetters text={text} />
      </>
    )
  }
  return (
    <>
      <span data-slot="glitch-text-content" className="block">
        {text}
      </span>
      {variant === "split" ? <FringeLayers text={text} /> : null}
      {variant === "slice" ? <BandLayers text={text} /> : null}
    </>
  )
}

type GlitchTextProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  text: string
  /** The element to render. A heading stays a heading. */
  as?: GlitchTextTag
  /** `split` offset colour fringes, `slice` horizontal bands shift, `flicker` letters drop out like a sign starting, `skew` the line jumps in steps. */
  variant?: GlitchTextVariant
  /** `hover` plays only on hover and focus. Listens on the nearest link or button around it. */
  effect?: GlitchTextEffect
  /** `view` plays once when first seen, `mount` plays right away. */
  trigger?: GlitchTextTrigger
  /** The same seed gives the same burst. */
  seed?: number
}

function GlitchText({ text, as: Tag = "span", variant = "split", effect, trigger = "view", seed = DEFAULT_SEED, className, ...props }: GlitchTextProps) {
  const reduceMotion = useReducedMotion() ?? false
  const anchorRef = useRef<HTMLSpanElement>(null)
  const seen = useInView(anchorRef, { once: true, margin: VIEW_MARGIN })
  const letterCount = useMemo(() => splitText(text, "chars").reduce((sum, word) => sum + word.pieces.length, 0), [text])
  const burst = useMemo(() => glitchBurst(variant, seed, letterCount), [variant, seed, letterCount])
  const { play, stop } = useBurst({ anchor: anchorRef, variant, burst })
  const auto = effect !== "hover" && !reduceMotion
  const due = trigger === "mount" || seen

  useEffect(() => {
    if (!auto || !due) return
    play()
    return stop
  }, [auto, due, play, stop])

  useHoverReplay(anchorRef, effect === "hover" && !reduceMotion, play)

  return (
    <Tag {...props} data-slot="glitch-text" data-variant={variant} data-effect={effect} className={cn("relative isolate inline-block max-w-full", className)}>
      {/* Inline-block so the copies share the box and wrap exactly like the text under them. */}
      <span ref={anchorRef} data-slot="glitch-text-stage" className="relative block">
        {/* The key sits inside the observed element, because useInView keeps watching the node it first got. */}
        <GlitchBody key={`${variant}:${reduceMotion}:${text}`} text={text} variant={variant} />
      </span>
    </Tag>
  )
}

export { GlitchText, type GlitchTextProps, type GlitchTextVariant, type GlitchTextEffect, type GlitchTextTrigger }
