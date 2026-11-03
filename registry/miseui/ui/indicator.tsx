import type * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type IndicatorVariant = "dot" | "count" | "ring" | "label"
type IndicatorEffect = "pop"
type IndicatorTone = "accent" | "neutral" | "success" | "warning" | "error"
type IndicatorCorner = "top-right" | "top-left" | "bottom-right" | "bottom-left"
type IndicatorShape = "square" | "circle"

const POP_FROM_SCALE = 0.5

/** Status hues are fixed, because the accent may itself be amber or red. Only `accent` follows the theme. */
const TONE_CLASS: Record<IndicatorTone, string> = {
  accent: "bg-mise text-mise-foreground",
  neutral: "bg-foreground text-background",
  success: "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950",
  warning: "bg-amber-400 text-amber-950",
  // The dark theme lightens the error colour past what white text can sit on.
  error: "bg-destructive text-white dark:text-background",
}

const RING_TONE_CLASS: Record<IndicatorTone, string> = {
  accent: "ring-mise",
  neutral: "ring-foreground",
  success: "ring-emerald-500",
  warning: "ring-amber-400",
  error: "ring-destructive",
}

/** The centre of the mark sits on the corner of a square child. */
const SQUARE_CORNER_CLASS: Record<IndicatorCorner, string> = {
  "top-right": "top-0 right-0 translate-x-1/2 -translate-y-1/2",
  "top-left": "top-0 left-0 -translate-x-1/2 -translate-y-1/2",
  "bottom-right": "right-0 bottom-0 translate-x-1/2 translate-y-1/2",
  "bottom-left": "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
}

/** A circle has nothing at its bounding corner, so the mark moves in by 14.6% to land on the rim itself. */
const CIRCLE_CORNER_CLASS: Record<IndicatorCorner, string> = {
  "top-right": "top-[14.6%] right-[14.6%] translate-x-1/2 -translate-y-1/2",
  "top-left": "top-[14.6%] left-[14.6%] -translate-x-1/2 -translate-y-1/2",
  "bottom-right": "right-[14.6%] bottom-[14.6%] translate-x-1/2 translate-y-1/2",
  "bottom-left": "bottom-[14.6%] left-[14.6%] -translate-x-1/2 translate-y-1/2",
}

/** The cut-out takes the surface colour, so a mark reads as sitting on its child and not as a smudge touching it. */
const CUT_OUT_CLASS = "ring-2 ring-[var(--indicator-surface,var(--background))]"

const MARK_CLASS: Record<Exclude<IndicatorVariant, "ring">, string> = {
  dot: "block size-2.5 rounded-full",
  count: "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs leading-none font-medium tabular-nums",
  label: "flex h-5 items-center rounded-sm px-1 text-xs leading-none font-medium whitespace-nowrap",
}

/** Anything that is not a positive whole number is treated as nothing to report. */
function normaliseCount(count: number | undefined) {
  if (count === undefined || !Number.isFinite(count)) return 0
  return Math.max(0, Math.floor(count))
}

function formatIndicatorCount(count: number | undefined, max: number) {
  const whole = normaliseCount(count)
  return whole > max ? `${max}+` : String(whole)
}

interface VisibilityOptions {
  count: number | undefined
  showZero: boolean
  text: React.ReactNode
}

/** No count at all means a plain "something here" mark; a count of zero means nothing here, unless asked. */
function isIndicatorVisible({ count, showZero, text }: VisibilityOptions) {
  if (text !== undefined && text !== null) return true
  if (count === undefined) return true
  return normaliseCount(count) > 0 || showZero
}

type IndicatorProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** What the mark sits on. Keep it small and interactive things inside it, as the mark itself ignores the pointer. */
  children: React.ReactNode
  /** `dot` says something is new, `count` says how much, `ring` circles the whole child, `label` carries a short word. */
  variant?: IndicatorVariant
  /** `pop` scales the mark in when its value changes, never on first paint. */
  effect?: IndicatorEffect
  count?: number
  /** Above this the mark reads 99+. */
  max?: number
  /** Keeps the mark at a count of zero. */
  showZero?: boolean
  /** The word in `label`. */
  text?: React.ReactNode
  /** Required: a number floating over an icon means nothing to a screen reader without its noun. */
  label: string
  tone?: IndicatorTone
  corner?: IndicatorCorner
  /** Set `circle` for avatars, so the mark lands on the rim instead of floating off the bounding box. */
  shape?: IndicatorShape
}

function Indicator({
  children,
  variant = "count",
  effect,
  count,
  max = 99,
  showZero = false,
  text,
  label,
  tone = "accent",
  corner = "top-right",
  shape = "square",
  className,
  ...props
}: IndicatorProps) {
  const reduceMotion = useReducedMotion() ?? false
  const visible = isIndicatorVisible({ count, showZero, text })
  const shown = variant === "label" ? text : formatIndicatorCount(count, max)
  const popKey = variant === "dot" ? String(normaliseCount(count)) : String(shown)
  const corners = shape === "circle" ? CIRCLE_CORNER_CLASS : SQUARE_CORNER_CLASS
  return (
    <span data-slot="indicator" data-variant={variant} data-effect={effect} className={cn("relative inline-flex w-fit", className)} {...props}>
      {children}
      {visible && variant === "ring" ? (
        <span
          aria-hidden="true"
          data-slot="indicator-ring"
          className={cn("pointer-events-none absolute -inset-1 ring-2", shape === "circle" ? "rounded-full" : "rounded-lg", RING_TONE_CLASS[tone])}
        />
      ) : null}
      {visible && variant !== "ring" ? (
        <span aria-hidden="true" data-slot="indicator-anchor" className={cn("pointer-events-none absolute z-10", corners[corner])}>
          <AnimatePresence initial={false}>
            <motion.span
              key={effect === "pop" && !reduceMotion ? popKey : "still"}
              data-slot="indicator-mark"
              className={cn(MARK_CLASS[variant], TONE_CLASS[tone], CUT_OUT_CLASS)}
              initial={effect === "pop" && !reduceMotion ? { scale: POP_FROM_SCALE } : false}
              animate={{ scale: 1 }}
              transition={SPRING_DEFAULT}
            >
              {variant === "dot" ? null : shown}
            </motion.span>
          </AnimatePresence>
        </span>
      ) : null}
      {visible ? <span className="sr-only">{label}</span> : null}
    </span>
  )
}

export {
  Indicator,
  formatIndicatorCount,
  isIndicatorVisible,
  type IndicatorProps,
  type IndicatorVariant,
  type IndicatorEffect,
  type IndicatorTone,
  type IndicatorCorner,
  type IndicatorShape,
}
