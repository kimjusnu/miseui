import type * as React from "react"
import { useReducedMotion } from "motion/react"
import { cn } from "@/registry/miseui/lib/utils"

type StatusState = "online" | "away" | "busy" | "offline" | "error" | "custom"
type StatusTone = "success" | "warning" | "danger" | "neutral"
type StatusVariant = "dot" | "badge" | "pill" | "plain"
type StatusEffect = "pulse"

const DEFAULT_WORD: Record<Exclude<StatusState, "custom">, string> = {
  online: "Online",
  away: "Away",
  busy: "Busy",
  offline: "Offline",
  error: "Error",
}

const STATE_TONE: Record<Exclude<StatusState, "custom">, StatusTone> = {
  online: "success",
  away: "warning",
  busy: "danger",
  offline: "neutral",
  error: "danger",
}

/** Fixed hues, never the accent: on a red or amber theme the accent would say the wrong state. */
const MARK_TONE_CLASS: Record<StatusTone, string> = {
  success: "text-emerald-500",
  warning: "text-amber-500",
  danger: "text-red-500 dark:text-red-400",
  neutral: "text-muted-foreground",
}

const WORD_TONE_CLASS: Record<StatusTone, string> = {
  success: "text-emerald-800 dark:text-emerald-300",
  warning: "text-amber-800 dark:text-amber-300",
  danger: "text-red-800 dark:text-red-300",
  neutral: "text-muted-foreground",
}

const BADGE_TONE_CLASS: Record<StatusTone, string> = {
  success: "bg-emerald-500/15",
  warning: "bg-amber-400/20",
  danger: "bg-red-500/10 dark:bg-red-500/15",
  neutral: "bg-muted",
}

const ROOT_CLASS: Record<StatusVariant, string> = {
  dot: "inline-flex size-4 shrink-0 items-center justify-center",
  badge: "inline-flex h-6 max-w-full min-w-0 items-center gap-2 rounded-md px-2 text-[13px] font-medium",
  pill: "inline-flex h-6 max-w-full min-w-0 items-center gap-2 rounded-full border bg-background px-2 text-[13px] text-foreground",
  plain: "inline-flex max-w-full min-w-0 items-center gap-2 text-sm text-foreground",
}

interface MarkProps {
  state: StatusState
  tone: StatusTone
  pulsing: boolean
}

/** Each state has its own silhouette, so the mark still reads in greyscale and for people who cannot tell red from green. */
function MarkShape({ state }: { state: StatusState }) {
  switch (state) {
    case "away":
      return (
        <>
          <circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 1a4 4 0 0 0 0 8z" fill="currentColor" />
        </>
      )
    case "busy":
      return (
        <>
          <circle cx="5" cy="5" r="4.5" fill="currentColor" />
          <rect x="2.5" y="4.25" width="5" height="1.5" rx="0.5" className="fill-background" />
        </>
      )
    case "offline":
      return <circle cx="5" cy="5" r="3.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
    case "error":
      return <path d="M5 .75 9.5 9H.5z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" />
    default:
      return <circle cx="5" cy="5" r="4.5" fill="currentColor" />
  }
}

function StatusMark({ state, tone, pulsing }: MarkProps) {
  return (
    <span aria-hidden="true" data-slot="status-mark" data-state={state} className={cn("relative inline-flex size-2.5 shrink-0", MARK_TONE_CLASS[tone])}>
      {pulsing ? <span data-slot="status-pulse" className="absolute inset-0 animate-ping rounded-full bg-current opacity-50 [animation-duration:1800ms]" /> : null}
      <svg viewBox="0 0 10 10" className="relative size-full">
        <MarkShape state={state} />
      </svg>
    </span>
  )
}

type StatusProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** What is true now. `custom` takes its word from children and its hue from `tone`. */
  state: StatusState
  /** The word. Defaults to the name of the state; `custom` must pass one. */
  children?: React.ReactNode
  /** The hue of a `custom` state. Ignored otherwise. */
  tone?: StatusTone
  /** `dot` the mark alone, `badge` a tinted tag, `pill` a neutral capsule with the mark in colour, `plain` mark and word with no surface. */
  variant?: StatusVariant
  /** `pulse` rings the mark, only while the state is live. Stops under reduced motion. */
  effect?: StatusEffect
  /** Is this state happening right now? Defaults to true for `online` alone. Pulsing an outage would only be noise. */
  live?: boolean
  /** Extra context after the word, such as "2 hours ago". Not shown by `dot`. */
  detail?: React.ReactNode
  /** Turns the root into a polite live region, for a status that changes while someone is reading. */
  announce?: boolean
}

function Status({ state, children, tone, variant = "plain", effect, live, detail, announce = false, className, ...props }: StatusProps) {
  const reduceMotion = useReducedMotion() ?? false
  const resolvedTone = state === "custom" ? (tone ?? "neutral") : STATE_TONE[state]
  const word = children ?? (state === "custom" ? null : DEFAULT_WORD[state])
  const isLive = live ?? state === "online"
  const onlyMark = variant === "dot"
  return (
    <span
      data-slot="status"
      data-variant={variant}
      data-effect={effect}
      data-state={state}
      data-live={isLive ? "true" : "false"}
      role={announce ? "status" : undefined}
      className={cn(ROOT_CLASS[variant], variant === "badge" && [BADGE_TONE_CLASS[resolvedTone], WORD_TONE_CLASS[resolvedTone]], className)}
      {...props}
    >
      <StatusMark state={state} tone={resolvedTone} pulsing={effect === "pulse" && isLive && !reduceMotion} />
      <span data-slot="status-word" className={onlyMark ? "sr-only" : "min-w-0 truncate"}>
        {word}
      </span>
      {detail && !onlyMark ? (
        <span data-slot="status-detail" className="min-w-0 truncate font-normal text-muted-foreground">
          {detail}
        </span>
      ) : null}
    </span>
  )
}

export { Status, type StatusProps, type StatusState, type StatusTone, type StatusVariant, type StatusEffect }
