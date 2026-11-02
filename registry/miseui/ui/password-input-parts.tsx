import { Check, Circle, Eye, EyeOff, TriangleAlert } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import type { PasswordCheck, PasswordCheckId, PasswordScore } from "@/registry/miseui/ui/password-input-strength"
import { cn } from "@/registry/miseui/lib/utils"

const INSTANT = { duration: 0 } as const
const MAX_SCORE = 4
const SEGMENTS = [1, 2, 3, 4] as const

/** Fixed hues: strength is a verdict, and the accent may itself be amber or red. */
const SCORE_FILL: Record<PasswordScore, string> = {
  0: "bg-transparent",
  1: "bg-destructive",
  2: "bg-amber-500",
  3: "bg-emerald-500",
  4: "bg-emerald-500",
}

interface PasswordLabels {
  show: string
  capsLock: string
  meter: string
  scores: readonly [string, string, string, string]
  checks: Record<PasswordCheckId, string>
  met: string
  unmet: string
}

interface RevealButtonProps {
  revealed: boolean
  label: string
  disabled?: boolean
  onToggle: () => void
}

function RevealButton({ revealed, label, disabled, onToggle }: RevealButtonProps) {
  const Icon = revealed ? EyeOff : Eye
  return (
    <button
      type="button"
      data-slot="password-input-reveal"
      aria-label={label}
      aria-pressed={revealed}
      disabled={disabled}
      // Keeps the caret where it was in the field when this is clicked.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onToggle}
      className={cn(
        "absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-md text-muted-foreground outline-none pointer-coarse:w-10",
        "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:text-foreground",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  )
}

function useMeterTransition(spring: boolean) {
  const reduceMotion = useReducedMotion() ?? false
  return spring && !reduceMotion ? SPRING_DEFAULT : INSTANT
}

const meterRole = (score: PasswordScore, labels: PasswordLabels) => ({
  role: "meter",
  "aria-label": labels.meter,
  "aria-valuemin": 0,
  "aria-valuemax": MAX_SCORE,
  "aria-valuenow": score,
  "aria-valuetext": score === 0 ? undefined : labels.scores[score - 1],
})

interface MeterProps {
  score: PasswordScore
  labels: PasswordLabels
  spring: boolean
}

function SegmentMeter({ score, labels, spring }: MeterProps) {
  const transition = useMeterTransition(spring)
  return (
    <div className="flex items-center gap-3">
      <div {...meterRole(score, labels)} data-slot="password-input-meter" className="grid flex-1 grid-cols-4 gap-1">
        {SEGMENTS.map((segment) => (
          <span key={segment} className="h-1 overflow-hidden rounded-full bg-muted">
            <motion.span
              data-slot="password-input-segment"
              data-filled={score >= segment ? "true" : "false"}
              className={cn("block h-full origin-left rtl:origin-right", SCORE_FILL[score])}
              initial={false}
              animate={{ scaleX: score >= segment ? 1 : 0 }}
              transition={transition}
            />
          </span>
        ))}
      </div>
      <span data-slot="password-input-score" className="min-w-12 text-right text-[13px] text-muted-foreground">
        {score === 0 ? null : labels.scores[score - 1]}
      </span>
    </div>
  )
}

/** One line on the bottom edge of the field, because `inline` has no room below it. */
function EdgeMeter({ score, labels, spring }: MeterProps) {
  const transition = useMeterTransition(spring)
  return (
    <span
      {...meterRole(score, labels)}
      data-slot="password-input-meter"
      className="pointer-events-none absolute inset-x-1 bottom-0 h-0.5 overflow-hidden rounded-full"
    >
      <motion.span
        data-slot="password-input-segment"
        className={cn("block h-full origin-left rtl:origin-right", SCORE_FILL[score])}
        initial={false}
        animate={{ scaleX: score / MAX_SCORE }}
        transition={transition}
      />
    </span>
  )
}

function Checklist({ checks, labels }: { checks: readonly PasswordCheck[]; labels: PasswordLabels }) {
  return (
    <ul data-slot="password-input-checklist" className="grid gap-1">
      {checks.map((check) => (
        <li
          key={check.id}
          data-met={check.met ? "true" : "false"}
          className={cn(
            "flex items-center gap-2 text-[13px] leading-5 transition-colors duration-(--duration-fast) ease-(--ease-mise)",
            check.met ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {check.met ? (
            <Check aria-hidden="true" className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Circle aria-hidden="true" className="size-3.5 shrink-0 opacity-50" />
          )}
          <span className="min-w-0">{labels.checks[check.id]}</span>
          <span className="sr-only">{check.met ? labels.met : labels.unmet}</span>
        </li>
      ))}
    </ul>
  )
}

function CapsLockHint({ text }: { text: string }) {
  return (
    <p
      role="status"
      data-slot="password-input-caps"
      className="flex items-center gap-2 text-[13px] leading-5 text-amber-700 dark:text-amber-400"
    >
      <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />
      {text}
    </p>
  )
}

export { CapsLockHint, Checklist, EdgeMeter, RevealButton, SegmentMeter, type PasswordLabels }
