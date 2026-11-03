import type * as React from "react"
import { Children, useRef } from "react"
import { motion, useInView, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type MotionRevealVariant = "rise" | "fade" | "clip"
type MotionRevealEffect = "stagger"
type MotionRevealTag = "div" | "section" | "article" | "ul" | "ol" | "li" | "span"

const MOTION_TAG = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  ul: motion.ul,
  ol: motion.ol,
  li: motion.li,
  span: motion.span,
} as const

/** Longer than a press: content arriving should be felt, not noticed. */
const REVEAL_TRANSITION = { ...SPRING_DEFAULT, duration: 0.6 }
/** Keeps a block from starting while most of it is still under the fold. */
const VIEW_MARGIN = "0px 0px -10% 0px"
const STAGGER_STEP_S = 0.06
/** A long list must not keep the last row waiting. */
const STAGGER_MAX_S = 0.48

const STATES = {
  rise: { hidden: { opacity: 0, y: 16 }, shown: { opacity: 1, y: 0 } },
  fade: { hidden: { opacity: 0 }, shown: { opacity: 1 } },
  clip: { hidden: { clipPath: "inset(0 0 100% 0)" }, shown: { clipPath: "inset(0 0 0% 0)" } },
} as const

function staggerDelay(index: number, count: number, delay = 0) {
  return delay + index * Math.min(STAGGER_STEP_S, STAGGER_MAX_S / Math.max(1, count))
}

type MotionRevealProps = Omit<React.HTMLAttributes<HTMLElement>, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> & {
  /** The element to render. A list wraps its staggered children in `li`. */
  as?: MotionRevealTag
  /** `rise` up and in, `fade` only opacity, `clip` wiped from the top for images and panels. */
  variant?: MotionRevealVariant
  /** `stagger` reveals the direct children one after another instead of the block as one. */
  effect?: MotionRevealEffect
  /** Seconds to wait before starting. */
  delay?: number
  /** Plays again each time it comes back into view. Off by default: reading something twice should not make you wait twice. */
  repeat?: boolean
}

function MotionReveal({ as = "div", variant = "rise", effect, delay = 0, repeat = false, className, children, ...props }: MotionRevealProps) {
  const reduceMotion = useReducedMotion() ?? false
  const ref = useRef<HTMLDivElement>(null)
  const seen = useInView(ref, { once: !repeat, margin: VIEW_MARGIN })
  const root = { ...props, "data-slot": "motion-reveal", "data-variant": variant, "data-effect": effect, className: cn(as === "span" && "inline-block", className) }
  // The cast is local: these tags take the same motion props, but a union of them cannot be called as one component.
  const Tag = MOTION_TAG[as] as typeof motion.div
  if (reduceMotion) {
    const Plain = as as "div"
    return (
      <Plain {...root} data-reduced="true">
        {children}
      </Plain>
    )
  }
  const { hidden, shown } = STATES[variant]
  const state = seen ? shown : hidden
  if (effect !== "stagger") {
    return (
      <Tag {...root} ref={ref} initial={hidden} animate={state} transition={{ ...REVEAL_TRANSITION, delay }}>
        {children}
      </Tag>
    )
  }
  const pieces = Children.toArray(children)
  const Piece = as === "ul" || as === "ol" ? motion.li : motion.div
  return (
    // Only the pieces move: the watched root stays put, so its own transform cannot change when it counts as seen.
    <Tag {...root} ref={ref}>
      {pieces.map((piece, index) => (
        <Piece key={index} data-slot="motion-reveal-piece" initial={hidden} animate={state} transition={{ ...REVEAL_TRANSITION, delay: staggerDelay(index, pieces.length, delay) }}>
          {piece}
        </Piece>
      ))}
    </Tag>
  )
}

export { MotionReveal, staggerDelay, type MotionRevealProps, type MotionRevealVariant, type MotionRevealEffect, type MotionRevealTag }
