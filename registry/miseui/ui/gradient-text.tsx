import type * as React from "react"
import { useRef, useState, useSyncExternalStore } from "react"
import { useInView, useReducedMotion } from "motion/react"
import { cn } from "@/registry/miseui/lib/utils"

type GradientTextVariant = "fade" | "accent" | "aurora" | "metal"
type GradientTextEffect = "flow"
type GradientTextTag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div"

/** Lives with the component so an install needs no global CSS. React 19 hoists a style with `href` into the head once. */
const KEYFRAMES = "@keyframes mise-gradient-flow{to{background-position-x:-200%}}"

/**
 * Each gradient is only applied where relative oklch works, so an older browser keeps the solid colour instead of
 * transparent text over nothing. The stops are clamped into a lightness band per theme: an amber accent gets dark enough
 * to read on white, a near-black accent gets light enough to read on black and to differ from the foreground beside it.
 * Aurora starts on the accent and walks away from hue 100: yellow darkened for a light page turns to mud, and the sine picks the direction and slows the walk near blue-violet.
 */
const STOP_CLASS: Record<GradientTextVariant, string> = {
  fade: "",
  accent:
    "[--mise-gradient-accent:oklch(from_var(--mise)_clamp(0.46,l,0.58)_c_h)] dark:[--mise-gradient-accent:oklch(from_var(--mise)_clamp(0.66,l,0.74)_c_h)]",
  aurora:
    "[--mise-gradient-1:oklch(from_var(--mise)_clamp(0.38,l,0.54)_c_h)] [--mise-gradient-2:oklch(from_var(--mise)_clamp(0.52,l,0.6)_c_calc(h_+_40_*_sin((h_-_100)_*_1deg)))] [--mise-gradient-3:oklch(from_var(--mise)_clamp(0.38,l,0.54)_c_calc(h_+_80_*_sin((h_-_100)_*_1deg)))] dark:[--mise-gradient-1:oklch(from_var(--mise)_clamp(0.72,l,0.82)_c_h)] dark:[--mise-gradient-2:oklch(from_var(--mise)_clamp(0.62,l,0.7)_c_calc(h_+_40_*_sin((h_-_100)_*_1deg)))] dark:[--mise-gradient-3:oklch(from_var(--mise)_clamp(0.72,l,0.82)_c_calc(h_+_80_*_sin((h_-_100)_*_1deg)))]",
  metal:
    "[--mise-gradient-base:var(--foreground)] [--mise-gradient-band:var(--muted-foreground)] dark:[--mise-gradient-base:var(--muted-foreground)] dark:[--mise-gradient-band:var(--foreground)]",
}

/** The colour if the gradient cannot be drawn. */
const SOLID_CLASS: Record<GradientTextVariant, string> = {
  fade: "text-foreground",
  accent: "text-foreground",
  aurora: "text-foreground",
  metal: "text-foreground",
}

const STILL_CLASS: Record<GradientTextVariant, string> = {
  fade: "supports-[color:oklch(from_red_l_c_h)]:text-transparent supports-[color:oklch(from_red_l_c_h)]:[background-image:linear-gradient(180deg,var(--foreground)_20%,var(--muted-foreground)_100%)]",
  accent:
    "supports-[color:oklch(from_red_l_c_h)]:text-transparent supports-[color:oklch(from_red_l_c_h)]:[background-image:linear-gradient(105deg_in_oklab,var(--foreground)_15%,var(--mise-gradient-accent)_85%)]",
  aurora:
    "supports-[color:oklch(from_red_l_c_h)]:text-transparent supports-[color:oklch(from_red_l_c_h)]:[background-image:linear-gradient(100deg_in_oklab,var(--mise-gradient-1),var(--mise-gradient-2)_50%,var(--mise-gradient-3))]",
  metal:
    "supports-[color:oklch(from_red_l_c_h)]:text-transparent supports-[color:oklch(from_red_l_c_h)]:[background-image:linear-gradient(100deg,var(--mise-gradient-base)_25%,var(--mise-gradient-band)_50%,var(--mise-gradient-base)_75%)]",
}

/** Both ends match and the image is twice as wide as the text, so moving it by exactly its own width never shows a seam. */
const FLOW_CLASS: Record<GradientTextVariant, string> = {
  fade: "supports-[color:oklch(from_red_l_c_h)]:text-transparent supports-[color:oklch(from_red_l_c_h)]:[background-image:linear-gradient(90deg,var(--foreground),var(--muted-foreground),var(--foreground))]",
  accent:
    "supports-[color:oklch(from_red_l_c_h)]:text-transparent supports-[color:oklch(from_red_l_c_h)]:[background-image:linear-gradient(90deg_in_oklab,var(--foreground),var(--mise-gradient-accent),var(--foreground))]",
  aurora:
    "supports-[color:oklch(from_red_l_c_h)]:text-transparent supports-[color:oklch(from_red_l_c_h)]:[background-image:linear-gradient(90deg_in_oklab,var(--mise-gradient-1),var(--mise-gradient-2),var(--mise-gradient-3),var(--mise-gradient-1))]",
  metal:
    "supports-[color:oklch(from_red_l_c_h)]:text-transparent supports-[color:oklch(from_red_l_c_h)]:[background-image:linear-gradient(90deg,var(--mise-gradient-base)_30%,var(--mise-gradient-band)_50%,var(--mise-gradient-base)_70%)]",
}

const FLOW_DRIFT = "[background-size:200%_100%] animate-[mise-gradient-flow_14s_linear_infinite] motion-reduce:animate-none"

/**
 * - Padding and an equal negative margin give descenders room that background-clip would otherwise cut.
 * - box-decoration-clone repaints the gradient per line; without it a wrapped second line starts halfway through.
 * - Selected text gets a real colour, because the selection paints over the gradient the letters are cut from.
 * - Important, because high contrast and forced colours have to win against the supports rule whatever the order.
 */
const PAINT_CLASS = [
  "bg-clip-text box-decoration-clone pb-[0.14em] -mb-[0.14em]",
  "selection:bg-mise-soft selection:text-foreground",
  "contrast-more:bg-none! contrast-more:text-foreground!",
  "forced-colors:bg-none! forced-colors:text-[CanvasText]!",
].join(" ")

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

type GradientTextProps = React.HTMLAttributes<HTMLElement> & {
  as?: GradientTextTag
  /** `fade` foreground into muted, `accent` foreground into the accent, `aurora` three neighbouring hues, `metal` a light band across a neutral. */
  variant?: GradientTextVariant
  /** `flow` drifts the colours slowly. It stops off screen, in a hidden tab, and on hover and focus. */
  effect?: GradientTextEffect
  /** Holds the flow. Tie it to a pause button on touch screens, where hover does not exist: motion past five seconds needs a way to stop it. */
  paused?: boolean
}

function GradientText({ as: Tag = "span", variant = "fade", effect, paused = false, className, children, onPointerEnter, onPointerLeave, onFocus, onBlur, ...props }: GradientTextProps) {
  const reduceMotion = useReducedMotion() ?? false
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref)
  const tabVisible = useTabVisible()
  const [held, setHeld] = useState(false)
  const flowing = effect === "flow" && !reduceMotion
  const playing = flowing && !paused && inView && tabVisible && !held
  const handlers = {
    onPointerEnter: (event: React.PointerEvent<HTMLElement>) => {
      setHeld(true)
      onPointerEnter?.(event)
    },
    onPointerLeave: (event: React.PointerEvent<HTMLElement>) => {
      setHeld(false)
      onPointerLeave?.(event)
    },
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      setHeld(true)
      onFocus?.(event)
    },
    onBlur: (event: React.FocusEvent<HTMLElement>) => {
      setHeld(false)
      onBlur?.(event)
    },
  }
  return (
    <Tag {...props} {...handlers} data-slot="gradient-text" data-variant={variant} data-effect={effect} data-playing={flowing ? (playing ? "true" : "false") : undefined} className={className}>
      {flowing ? <style href="mise-gradient-text" precedence="default">{KEYFRAMES}</style> : null}
      <span
        ref={ref}
        data-slot="gradient-text-paint"
        className={cn(PAINT_CLASS, STOP_CLASS[variant], SOLID_CLASS[variant], flowing ? FLOW_CLASS[variant] : STILL_CLASS[variant], flowing && FLOW_DRIFT)}
        style={flowing ? { animationPlayState: playing ? "running" : "paused" } : undefined}
      >
        {children}
      </span>
    </Tag>
  )
}

export { GradientText, type GradientTextProps, type GradientTextVariant, type GradientTextEffect }
