import { AnimatePresence, motion } from "motion/react"
import { Pause, Play, RotateCcw } from "lucide-react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { timeParts, type TimerMode, type TimerUnit } from "@/registry/miseui/ui/timer-math"
import { cn } from "@/registry/miseui/lib/utils"

const INSTANT = { duration: 0 } as const

interface TimerLabels {
  days: string
  hours: string
  minutes: string
  seconds: string
  pause: string
  resume: string
  reset: string
}

const DEFAULT_LABELS: TimerLabels = {
  days: "Days",
  hours: "Hours",
  minutes: "Min",
  seconds: "Sec",
  pause: "Pause",
  resume: "Resume",
  reset: "Reset",
}

/** Counting down, digits fall into place; counting up, they rise. The direction agrees with what the number is doing. */
function RollDigit({ digit, mode, reduceMotion }: { digit: string; mode: TimerMode; reduceMotion: boolean }) {
  const travel = mode === "down" ? "-100%" : "100%"
  const leave = mode === "down" ? "100%" : "-100%"
  return (
    <span data-slot="timer-digit" className="relative inline-block overflow-hidden align-baseline">
      <span className="invisible">0</span>
      <AnimatePresence initial={false}>
        <motion.span
          key={digit}
          className="absolute inset-0 text-center"
          initial={{ y: travel, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: leave, opacity: 0 }}
          transition={reduceMotion ? INSTANT : SPRING_DEFAULT}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

interface TimerTextProps {
  text: string
  roll: boolean
  mode: TimerMode
  reduceMotion: boolean
}

function TimerText({ text, roll, mode, reduceMotion }: TimerTextProps) {
  if (!roll || reduceMotion) return <>{text}</>
  const characters = Array.from(text)
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" data-slot="timer-roll" className="inline-flex">
        {/* Keyed from the right, so seconds keep rolling when a column on the left appears or goes. */}
        {characters.map((character, index) => {
          const key = characters.length - index
          return /[0-9]/.test(character) ? (
            <RollDigit key={key} digit={character} mode={mode} reduceMotion={reduceMotion} />
          ) : (
            <span key={key} className="whitespace-pre">
              {character}
            </span>
          )
        })}
      </span>
    </>
  )
}

interface TimerBoxesProps {
  seconds: number
  units: readonly TimerUnit[]
  labels: TimerLabels
  roll: boolean
  mode: TimerMode
  reduceMotion: boolean
}

function TimerBoxes({ seconds, units, labels, roll, mode, reduceMotion }: TimerBoxesProps) {
  const parts = timeParts(seconds)
  return (
    <span className="grid auto-cols-[minmax(0,1fr)] grid-flow-col gap-2" data-slot="timer-boxes">
      {units.map((unit) => (
        <span key={unit} data-slot="timer-box" data-unit={unit} className="grid min-w-0 justify-items-center gap-1 rounded-md border bg-background px-1 py-2">
          <span className="text-[clamp(16px,10cqi,24px)] leading-tight font-semibold tabular-nums">
            <TimerText text={String(parts[unit]).padStart(2, "0")} roll={roll} mode={mode} reduceMotion={reduceMotion} />
          </span>
          <span className="max-w-full truncate text-xs text-muted-foreground">{labels[unit]}</span>
        </span>
      ))}
    </span>
  )
}

function TimerRing({ fraction, running }: { fraction: number; running: boolean }) {
  return (
    <svg aria-hidden="true" data-slot="timer-ring" viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90">
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted" />
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={1 - fraction}
        // The digit changes once a second, so a one second linear glide meets the next reading exactly.
        className={cn("text-mise motion-reduce:transition-none", running && "transition-[stroke-dashoffset] duration-1000 ease-linear")}
      />
    </svg>
  )
}

const CONTROL_CLASS = [
  "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground pointer-coarse:size-10",
  "transition-[color,background-color] duration-(--duration-fast) ease-(--ease-mise)",
  "outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "active:bg-accent active:duration-0 disabled:pointer-events-none disabled:opacity-50",
]

interface TimerControlsProps {
  running: boolean
  finished: boolean
  labels: TimerLabels
  onToggle: () => void
  onReset: () => void
  className?: string
}

function TimerControls({ running, finished, labels, onToggle, onReset, className }: TimerControlsProps) {
  const Icon = running ? Pause : Play
  return (
    <span data-slot="timer-controls" className={cn("inline-flex items-center gap-1", className)}>
      <button type="button" aria-label={running ? labels.pause : labels.resume} disabled={finished} className={cn(CONTROL_CLASS)} onClick={onToggle}>
        <Icon aria-hidden="true" className="size-4" />
      </button>
      <button type="button" aria-label={labels.reset} className={cn(CONTROL_CLASS)} onClick={onReset}>
        <RotateCcw aria-hidden="true" className="size-4" />
      </button>
    </span>
  )
}

export { DEFAULT_LABELS, TimerBoxes, TimerControls, TimerRing, TimerText, type TimerLabels }
