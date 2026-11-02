import type * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/registry/miseui/lib/utils"

const DEFAULT_BARS = 5
/** Resting height, as a fraction of the full bar. Visible when idle, so the control never looks empty. */
const IDLE_SCALE = 0.25
/** Outer bars still reach this share of the centre bar's height, so the wave stays readable at low levels. */
const EDGE_WEIGHT = 0.35
/** Matches --duration-fast: quick enough to track speech, slow enough not to flicker. */
const LEVEL_TRANSITION_SECONDS = 0.15
const LABEL_LISTENING = "Listening"
const LABEL_OFF = "Microphone off"

interface VoiceWaveProps extends React.ComponentProps<"div"> {
  /** Current input level, 0..1. Values outside the range are clamped. */
  level?: number
  /** Whether the microphone is listening. When false every bar rests at its idle height. */
  active?: boolean
  bars?: number
  /** Overrides the accessible name ("Listening" / "Microphone off"). */
  label?: string
}

function clampLevel(level: number) {
  if (!Number.isFinite(level)) return 0
  return Math.min(1, Math.max(0, level))
}

/** 1 at the centre bar, falling on a cosine towards EDGE_WEIGHT at the outer bars. */
function barWeight(index: number, bars: number) {
  const centre = (bars - 1) / 2
  const distance = centre === 0 ? 0 : Math.abs(index - centre) / centre
  return EDGE_WEIGHT + (1 - EDGE_WEIGHT) * Math.cos((distance * Math.PI) / 2)
}

function barScale(index: number, bars: number, level: number, active: boolean) {
  if (!active) return IDLE_SCALE
  return IDLE_SCALE + (1 - IDLE_SCALE) * level * barWeight(index, bars)
}

function VoiceWave({
  level = 0,
  active = false,
  bars = DEFAULT_BARS,
  label,
  className,
  ...props
}: VoiceWaveProps) {
  const reduceMotion = useReducedMotion()
  const clampedLevel = clampLevel(level)
  const barCount = Math.max(1, Math.floor(bars))

  return (
    <div
      role="img"
      aria-label={label ?? (active ? LABEL_LISTENING : LABEL_OFF)}
      data-slot="voice-wave"
      data-active={active ? "true" : "false"}
      data-level={clampedLevel}
      className={cn("inline-flex h-6 items-center gap-1", className)}
      {...props}
    >
      {Array.from({ length: barCount }, (_, index) => (
        <motion.span
          key={index}
          data-testid="voice-bar"
          className={cn("h-full w-1 origin-center rounded-full", active ? "bg-mise" : "bg-muted-foreground")}
          initial={false}
          animate={{ scaleY: barScale(index, barCount, clampedLevel, active) }}
          transition={reduceMotion ? { duration: 0 } : { duration: LEVEL_TRANSITION_SECONDS, ease: "easeOut" }}
        />
      ))}
    </div>
  )
}

export { VoiceWave, type VoiceWaveProps }
