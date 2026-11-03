import type * as React from "react"
import { useRef } from "react"
import { AlertTriangle, Check, X } from "lucide-react"
import { motion, useInView, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type TimelineStatus = "neutral" | "current" | "success" | "warning" | "error"

/**
 * Success, warning and error are fixed hues because the accent may itself be amber or red. `current` is the one that
 * follows the accent: it says where things stand now, not whether they went well. Soft fills keep a long history
 * quiet, and error alone is solid, since it is the one line that may need someone to act.
 */
const MARKER_CLASS: Record<TimelineStatus, string> = {
  neutral: "size-2.5 border-2 border-muted-foreground/50",
  current: "size-3 bg-mise ring-4 ring-mise/20",
  success: "size-6 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  warning: "size-6 bg-amber-400/20 text-amber-800 dark:text-amber-300",
  error: "size-6 bg-destructive text-white dark:text-background",
}

const GLYPH: Partial<Record<TimelineStatus, typeof Check>> = { success: Check, warning: AlertTriangle, error: X }

const DOT_CLASS: Record<TimelineStatus, string> = {
  neutral: "bg-muted-foreground/50",
  current: "bg-mise",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-destructive",
}

const STATUS_TEXT_CLASS: Record<Exclude<TimelineStatus, "neutral">, string> = {
  current: "text-foreground",
  success: "text-emerald-700 dark:text-emerald-300",
  warning: "text-amber-800 dark:text-amber-300",
  error: "text-destructive",
}

function TimelineMarker({ status, icon }: { status: TimelineStatus; icon?: React.ReactNode }) {
  const Glyph = GLYPH[status]
  return (
    // The 24 px slot stays the same for every status, so a small marker and a large one share one centre line.
    <span aria-hidden="true" data-slot="timeline-marker-slot" className="flex size-6 shrink-0 items-center justify-center">
      {icon ? (
        <span data-slot="timeline-marker" data-status={status} className="flex size-6 items-center justify-center rounded-full bg-muted text-foreground [&_svg]:size-3.5">
          {icon}
        </span>
      ) : (
        <span data-slot="timeline-marker" data-status={status} className={cn("flex items-center justify-center rounded-full", MARKER_CLASS[status])}>
          {Glyph ? <Glyph className="size-3.5" strokeWidth={2.5} /> : null}
        </span>
      )}
    </span>
  )
}

function TimelineDot({ status }: { status: TimelineStatus }) {
  return (
    <span aria-hidden="true" className="flex h-5 w-4 shrink-0 items-center justify-center">
      <span data-slot="timeline-marker" data-status={status} className={cn("size-2 rounded-full", DOT_CLASS[status])} />
    </span>
  )
}

interface ConnectorProps {
  axis: "x" | "y"
  draw: boolean
  className?: string
}

/**
 * Each stretch draws once when it enters the view. Tying it to scroll progress instead would leave the last stretch
 * half-drawn at the end of a short page, where the scroll can never reach it.
 */
function DrawnConnector({ axis, className }: Omit<ConnectorProps, "draw">) {
  const ref = useRef<HTMLSpanElement>(null)
  const seen = useInView(ref, { once: true, margin: "0px 0px -10% 0px" })
  const scale = seen ? 1 : 0
  return (
    <span ref={ref} aria-hidden="true" data-slot="timeline-connector" data-drawn={seen ? "true" : "false"} className={cn("block overflow-hidden", className)}>
      <motion.span
        className={cn("block size-full bg-foreground/30", axis === "x" ? "origin-left rtl:origin-right" : "origin-top")}
        initial={axis === "x" ? { scaleX: 0 } : { scaleY: 0 }}
        animate={axis === "x" ? { scaleX: scale } : { scaleY: scale }}
        transition={SPRING_DEFAULT}
      />
    </span>
  )
}

function TimelineConnector({ axis, draw, className }: ConnectorProps) {
  const reduceMotion = useReducedMotion() ?? false
  if (draw && !reduceMotion) return <DrawnConnector axis={axis} className={className} />
  return <span aria-hidden="true" data-slot="timeline-connector" className={cn("block bg-border", className)} />
}

export { STATUS_TEXT_CLASS, TimelineConnector, TimelineDot, TimelineMarker, type TimelineStatus }
