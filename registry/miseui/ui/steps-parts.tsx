import { AlertTriangle, Check } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type StepState = "done" | "current" | "upcoming" | "error"

const INSTANT = { duration: 0 } as const

/** A step can say it failed; otherwise its place relative to `current` decides. */
function stepState(index: number, current: number, error?: boolean): StepState {
  if (error) return "error"
  if (index < current) return "done"
  return index === current ? "current" : "upcoming"
}

/**
 * Done is neutral on purpose. It is progress and not a success message, and in the accent it would compete with
 * the one step that needs attention now. Current gets the accent, so the eye lands there first.
 */
const MARKER_CLASS: Record<StepState, string> = {
  done: "bg-foreground text-background",
  current: "bg-mise text-mise-foreground",
  upcoming: "border border-input text-muted-foreground",
  error: "bg-destructive text-white dark:text-background",
}

const TITLE_CLASS: Record<StepState, string> = {
  done: "text-foreground",
  current: "font-medium text-foreground",
  upcoming: "text-muted-foreground",
  error: "font-medium text-destructive",
}

const SEGMENT_CLASS: Record<StepState, string> = {
  done: "bg-foreground",
  current: "bg-mise",
  upcoming: "bg-muted",
  error: "bg-destructive",
}

function StepMarker({ state, number }: { state: StepState; number: number }) {
  const Glyph = state === "done" ? Check : state === "error" ? AlertTriangle : null
  return (
    <span
      aria-hidden="true"
      data-slot="steps-marker"
      data-state={state}
      className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums", MARKER_CLASS[state])}
    >
      {Glyph ? <Glyph className="size-3.5" strokeWidth={state === "done" ? 3 : 2} /> : number}
    </span>
  )
}

interface ConnectorProps {
  axis: "x" | "y"
  /** The stretch of the journey already behind the person. */
  filled: boolean
  /** Draws the fill with a spring instead of placing it. */
  draw: boolean
  className?: string
}

function StepConnector({ axis, filled, draw, className }: ConnectorProps) {
  const reduceMotion = useReducedMotion() ?? false
  const scale = filled ? 1 : 0
  return (
    <span aria-hidden="true" data-slot="steps-connector" data-filled={filled ? "true" : "false"} className={cn("block overflow-hidden bg-border", className)}>
      <motion.span
        className={cn("block size-full bg-foreground", axis === "x" ? "origin-left rtl:origin-right" : "origin-top")}
        initial={false}
        animate={axis === "x" ? { scaleX: scale } : { scaleY: scale }}
        transition={draw && !reduceMotion ? SPRING_DEFAULT : INSTANT}
      />
    </span>
  )
}

export { SEGMENT_CLASS, StepConnector, StepMarker, TITLE_CLASS, stepState, type StepState }
