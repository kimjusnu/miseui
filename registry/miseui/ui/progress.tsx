import type * as React from "react"
import { useId } from "react"
import { Progress as ProgressPrimitive } from "radix-ui"
import { useReducedMotion } from "motion/react"
import { ProgressFill, ProgressSegments, ProgressSweep } from "@/registry/miseui/ui/progress-parts"
import { cn } from "@/registry/miseui/lib/utils"

type ProgressVariant = "plain" | "thin" | "segmented" | "labelled"
type ProgressEffect = "shimmer" | "spring"

const DEFAULT_MAX = 100
const DEFAULT_STEPS = 5

const TRACK_CLASS: Record<ProgressVariant, string> = {
  plain: "relative h-2 w-full overflow-hidden rounded-full bg-input/70",
  thin: "relative h-0.5 w-full overflow-hidden rounded-full bg-input/70",
  // The cells carry the track colour themselves, so the gaps between them read as real breaks.
  segmented: "flex h-2 w-full gap-1 rounded-full",
  labelled: "relative h-2 w-full overflow-hidden rounded-full bg-input/70",
}

type ProgressProps = Omit<React.ComponentProps<typeof ProgressPrimitive.Root>, "value" | "max"> & {
  /** Current value. `null` or omitted means indeterminate: work is happening and no one knows how much. */
  value?: number | null
  max?: number
  /** Names the bar for assistive tech. `labelled` also shows it above the bar. */
  label?: string
  /** `plain` bar, `thin` hairline, `segmented` N discrete cells, `labelled` label and percent above. */
  variant?: ProgressVariant
  /** `shimmer` sweeps a band while work runs; `spring` lets the fill settle on a critically damped spring. */
  effect?: ProgressEffect
  /** How many cells `segmented` draws. */
  steps?: number
}

function clampValue(value: number | null | undefined, max: number) {
  if (value === null || value === undefined || Number.isNaN(value)) return null
  return Math.min(max, Math.max(0, value))
}

interface ProgressMarksProps {
  percent: number | null
  variant: ProgressVariant
  effect: ProgressEffect | undefined
  steps: number
}

function ProgressMarks({ percent, variant, effect, steps }: ProgressMarksProps) {
  const reduceMotion = useReducedMotion() ?? false
  const spring = effect === "spring"
  const shimmer = effect === "shimmer"
  if (variant === "segmented") {
    return <ProgressSegments percent={percent} steps={steps} spring={spring} shimmer={shimmer} reduceMotion={reduceMotion} />
  }
  if (percent === null) return <ProgressSweep reduceMotion={reduceMotion} />
  // The band marks running work, so it stops the moment the bar is full.
  const band = shimmer && percent < 100 && !reduceMotion
  return <ProgressFill percent={percent} spring={spring} band={band} reduceMotion={reduceMotion} />
}

function Progress({
  value,
  max = DEFAULT_MAX,
  label,
  variant = "plain",
  effect,
  steps = DEFAULT_STEPS,
  className,
  ...props
}: ProgressProps) {
  const labelId = useId()
  const clamped = clampValue(value, max)
  const percent = clamped === null ? null : (clamped / max) * 100
  const labelled = variant === "labelled"

  const bar = (
    <ProgressPrimitive.Root
      data-slot={labelled ? "progress-bar" : "progress"}
      data-variant={labelled ? undefined : variant}
      data-effect={labelled ? undefined : effect}
      value={clamped}
      max={max}
      aria-label={labelled ? undefined : label}
      aria-labelledby={labelled ? labelId : undefined}
      className={cn(TRACK_CLASS[variant], !labelled && className)}
      {...props}
    >
      <ProgressMarks percent={percent} variant={variant} effect={effect} steps={steps} />
    </ProgressPrimitive.Root>
  )
  if (!labelled) return bar
  return (
    <div data-slot="progress" data-variant={variant} data-effect={effect} className={cn("grid w-full gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span id={labelId} className="min-w-0 truncate font-medium">
          {label}
        </span>
        {percent === null ? null : (
          <span aria-hidden="true" className="shrink-0 text-[13px] text-muted-foreground tabular-nums">
            {Math.round(percent)}%
          </span>
        )}
      </div>
      {bar}
    </div>
  )
}

export { Progress, type ProgressProps, type ProgressVariant, type ProgressEffect }
