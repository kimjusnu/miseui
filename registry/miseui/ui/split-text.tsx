import type * as React from "react"
import { useRef } from "react"
import { motion, useInView, useReducedMotion } from "motion/react"
import {
  SPLIT_PRESETS,
  pieceCount,
  pieceDelay,
  splitText,
  type SplitBy,
  type SplitOrigin,
  type SplitPiece,
  type SplitPreset,
  type SplitTextVariant,
} from "@/registry/miseui/ui/split-text-math"
import { cn } from "@/registry/miseui/lib/utils"

type SplitTextEffect = "center"
type SplitTextTrigger = "view" | "mount"
type SplitTextTag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div"

/** Keeps a headline from starting while its last line is still under the fold. */
const VIEW_MARGIN = "0px 0px -10% 0px"

interface PieceProps {
  piece: SplitPiece
  preset: SplitPreset
  shown: boolean
  /** Seconds. */
  delay: number
}

function Piece({ piece, preset, shown, delay }: PieceProps) {
  const moving = (
    <motion.span
      data-slot="split-text-piece"
      className="inline-block"
      initial={preset.hidden}
      animate={shown ? preset.shown : preset.hidden}
      transition={{ ...preset.transition, delay }}
    >
      {piece.text}
    </motion.span>
  )
  if (!preset.masked) return moving
  return (
    // The extra bottom room keeps descenders inside the clip; the negative margin gives the line height back.
    <span data-slot="split-text-mask" className="inline-block overflow-y-clip pb-[0.14em] -mb-[0.14em] align-baseline">
      {moving}
    </span>
  )
}

interface SplitPiecesProps {
  text: string
  variant: SplitTextVariant
  by: SplitBy
  origin: SplitOrigin
  shown: boolean
  delay: number
}

function SplitPieces({ text, variant, by, origin, shown, delay }: SplitPiecesProps) {
  const words = splitText(text, by)
  const count = pieceCount(words)
  return (
    <>
      {words.map((word, position) => (
        <span key={word.key}>
          {/* A word holds together, so a line never breaks in the middle of one. */}
          <span data-slot="split-text-word" className="inline-block whitespace-nowrap">
            {word.pieces.map((piece) => (
              <Piece
                key={piece.index}
                piece={piece}
                preset={SPLIT_PRESETS[variant]}
                shown={shown}
                delay={delay + pieceDelay(piece.index, count, by, origin) / 1000}
              />
            ))}
          </span>
          {position < words.length - 1 ? " " : null}
        </span>
      ))}
    </>
  )
}

type SplitTextProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  text: string
  /** The element to render. A heading stays a heading. */
  as?: SplitTextTag
  /** `rise` out from behind a line, `fade` a quiet arrival, `blur` from out of focus. */
  variant?: SplitTextVariant
  /** `center` starts the wave from the middle, for a centred headline. */
  effect?: SplitTextEffect
  /** Split by grapheme or by word. Long text reads better by word. */
  by?: SplitBy
  /** `view` plays once when first seen, `mount` plays right away, for what is on screen at load. */
  trigger?: SplitTextTrigger
  /** Seconds to wait before starting, to follow something else in. */
  delay?: number
}

function SplitText({ text, as: Tag = "span", variant = "rise", effect, by = "chars", trigger = "view", delay = 0, className, ...props }: SplitTextProps) {
  const reduceMotion = useReducedMotion() ?? false
  const ref = useRef<HTMLSpanElement>(null)
  const seen = useInView(ref, { once: true, margin: VIEW_MARGIN })
  const root = { ...props, "data-slot": "split-text", "data-variant": variant, "data-effect": effect }
  if (reduceMotion) {
    return (
      <Tag {...root} data-reduced="true" className={className}>
        {text}
      </Tag>
    )
  }
  return (
    <Tag {...root} className={cn("relative", className)}>
      {/* Spans of single letters are read out one letter at a time, so assistive tech gets the real sentence instead. */}
      <span className="sr-only">{text}</span>
      <span ref={ref} key={`${variant}:${by}:${text}`} aria-hidden="true" data-slot="split-text-visual">
        <SplitPieces
          text={text}
          variant={variant}
          by={by}
          origin={effect === "center" ? "center" : "start"}
          shown={trigger === "mount" || seen}
          delay={delay}
        />
      </span>
    </Tag>
  )
}

export {
  SplitText,
  SPLIT_PRESETS,
  pieceDelay,
  splitText,
  type SplitBy,
  type SplitOrigin,
  type SplitPreset,
  type SplitTextProps,
  type SplitTextVariant,
  type SplitTextEffect,
  type SplitTextTrigger,
}
