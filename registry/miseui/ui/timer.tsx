import type * as React from "react"
import { useReducedMotion } from "motion/react"
import { Timer as TimerIcon } from "lucide-react"
import { formatClock, spokenTime, visibleUnits, type TimerMode } from "@/registry/miseui/ui/timer-math"
import { DEFAULT_LABELS, TimerBoxes, TimerControls, TimerRing, TimerText, type TimerLabels } from "@/registry/miseui/ui/timer-parts"
import { useTimer, type UseTimerOptions } from "@/registry/miseui/ui/timer-state"
import { cn } from "@/registry/miseui/lib/utils"

type TimerVariant = "plain" | "boxes" | "compact" | "ring"
type TimerEffect = "roll"

type TimerProps = Omit<React.ComponentProps<"div">, "children"> &
  UseTimerOptions & {
    /** `plain` a large clock, `boxes` one tile per unit, `compact` a small chip for a row, `ring` a clock inside a progress circle. */
    variant?: TimerVariant
    /** `roll` turns each digit like a counter wheel. People who turned motion off get a plain change. */
    effect?: TimerEffect
    /** Adds pause, resume and reset buttons. */
    controls?: boolean
    labels?: Partial<TimerLabels>
    /** What a screen reader hears. Called with whole seconds; return the same text for a whole minute, or it will speak every second. */
    speak?: (seconds: number, mode: TimerMode) => string
  }

const ROOT_CLASS: Record<TimerVariant, string> = {
  // w-full: a size container takes no width from its content, so as a flex item it would otherwise collapse to nothing.
  plain: "@container grid w-full min-w-0 justify-items-start gap-2",
  boxes: "@container grid w-full min-w-0 gap-2",
  compact: "inline-flex min-h-8 max-w-full items-center gap-2 rounded-md border bg-background px-2 text-[13px] leading-5 pointer-coarse:min-h-10",
  ring: "@container relative grid aspect-square w-full max-w-48 place-items-center",
}

/** Compact sits in a row, so its buttons shrink with it on a mouse and still reach 40 px under a finger. */
const CONTROLS_CLASS: Partial<Record<TimerVariant, string>> = {
  compact: "-mr-1 [&>button]:size-7 [&>button]:pointer-coarse:size-10",
  ring: "mt-2",
}

interface DisplayProps {
  timer: ReturnType<typeof useTimer>
  variant: TimerVariant
  mode: TimerMode
  roll: boolean
  reduceMotion: boolean
  labels: TimerLabels
}

function TimerDisplay({ timer, variant, mode, roll, reduceMotion, labels }: DisplayProps) {
  const text = <TimerText text={formatClock(timer.seconds, timer.span)} roll={roll} mode={mode} reduceMotion={reduceMotion} />
  // role timer is silent by default: the digits stay readable on demand and the live region below does the speaking.
  const shared = { role: "timer", "data-slot": "timer-display" } as const
  if (variant === "boxes") {
    return (
      <span {...shared} className="block">
        <TimerBoxes seconds={timer.seconds} units={visibleUnits(timer.span)} labels={labels} roll={roll} mode={mode} reduceMotion={reduceMotion} />
      </span>
    )
  }
  if (variant === "compact") {
    return (
      <span className="inline-flex min-w-0 items-center gap-2">
        <TimerIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <span {...shared} className="font-medium tabular-nums">
          {text}
        </span>
      </span>
    )
  }
  if (variant === "ring") {
    return (
      <span {...shared} className="text-[clamp(20px,15cqi,32px)] leading-none font-semibold tracking-tight tabular-nums">
        {text}
      </span>
    )
  }
  return (
    <span {...shared} className="max-w-full text-[clamp(28px,14cqi,48px)] leading-none font-semibold tracking-tight tabular-nums">
      {text}
    </span>
  )
}

function Timer({ mode = "down", target, duration, running, defaultRunning, onRunningChange, onComplete, now, variant = "plain", effect, controls = false, labels, speak = spokenTime, className, ...props }: TimerProps) {
  const timer = useTimer({ mode, target, duration, running, defaultRunning, onRunningChange, onComplete, now })
  const reduceMotion = useReducedMotion() ?? false
  const merged = { ...DEFAULT_LABELS, ...labels }
  const controlRow = controls ? (
    <TimerControls
      running={timer.running}
      finished={timer.finished}
      labels={merged}
      onToggle={() => timer.setRunning(!timer.running)}
      onReset={timer.reset}
      className={CONTROLS_CLASS[variant]}
    />
  ) : null
  const display = <TimerDisplay timer={timer} variant={variant} mode={mode} roll={effect === "roll"} reduceMotion={reduceMotion} labels={merged} />
  return (
    <div
      data-slot="timer"
      data-variant={variant}
      data-effect={effect}
      data-running={timer.running ? "true" : "false"}
      data-finished={timer.finished ? "true" : "false"}
      className={cn(ROOT_CLASS[variant], className)}
      {...props}
    >
      {variant === "ring" ? <TimerRing fraction={timer.fraction} running={timer.running} /> : null}
      {variant === "ring" ? (
        <span className="relative grid justify-items-center">
          {display}
          {controlRow}
        </span>
      ) : (
        <>
          {display}
          {controlRow}
        </>
      )}
      <span aria-live="polite" aria-atomic="true" data-slot="timer-announcer" className="sr-only">
        {speak(timer.seconds, mode)}
      </span>
    </div>
  )
}

export { Timer, formatClock, useTimer, type TimerProps, type TimerVariant, type TimerEffect, type TimerMode, type TimerLabels }
