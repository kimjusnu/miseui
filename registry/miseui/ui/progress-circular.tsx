import type * as React from "react"
import { useReducedMotion } from "motion/react"
import { toPercent, VIEW_SIZE } from "@/registry/miseui/ui/progress-circular-math"
import { CircularMarks, type CircularVariant } from "@/registry/miseui/ui/progress-circular-parts"
import { cn } from "@/registry/miseui/lib/utils"

type ProgressCircularEffect = "spring"
type ProgressCircularSize = "sm" | "md" | "lg"

const DEFAULT_MAX = 100
const DEFAULT_STEPS = 12
const MIN_STEPS = 2

const SIZE_CLASS: Record<ProgressCircularSize, string> = { sm: "size-10", md: "size-16", lg: "size-24" }
const VALUE_CLASS: Record<ProgressCircularSize, string> = {
  sm: "text-[13px]",
  md: "text-[13px]",
  lg: "text-xl tracking-tight",
}

type ProgressCircularProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Current value. `null` or omitted means indeterminate: work is happening and no one knows how much. */
  value?: number | null
  max?: number
  /** Names the circle for assistive tech. A large gauge also writes it in its open quarter. */
  label?: string
  /** `ring` thick with round ends, `thin` a hairline, `gauge` 270 degrees like a dial, `segmented` discrete cells. */
  variant?: CircularVariant
  /** `spring` lets the fill settle on a critically damped spring, and a new value interrupts it cleanly. */
  effect?: ProgressCircularEffect
  /** 40, 64 or 96 px. */
  size?: ProgressCircularSize
  /** How many cells `segmented` draws. */
  steps?: number
  /** Writes the percent in the middle. Off by default at `sm`, where it would crowd the ring. */
  showValue?: boolean
  /** Replaces the percent, for an icon or your own unit. */
  children?: React.ReactNode
}

function CentreValue({ percent, size, thin }: { percent: number; size: ProgressCircularSize; thin: boolean }) {
  return (
    <span
      aria-hidden="true"
      data-slot="progress-circular-value"
      className={cn("tabular-nums", thin ? "font-normal" : "font-medium", VALUE_CLASS[size])}
    >
      {Math.round(percent)}
      <span className="text-[0.75em] text-muted-foreground">%</span>
    </span>
  )
}

function stateOf(percent: number | null) {
  if (percent === null) return "indeterminate"
  return percent >= 100 ? "complete" : "loading"
}

function ProgressCircular({
  value,
  max = DEFAULT_MAX,
  label,
  variant = "ring",
  effect,
  size = "md",
  steps = DEFAULT_STEPS,
  showValue = size !== "sm",
  children,
  className,
  ...props
}: ProgressCircularProps) {
  const reduceMotion = useReducedMotion() ?? false
  const percent = toPercent(value, max)
  const determinate = percent !== null
  const valueText = showValue && determinate ? <CentreValue percent={percent} size={size} thin={variant === "thin"} /> : null
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={determinate ? (percent / 100) * max : undefined}
      aria-valuetext={determinate ? `${Math.round(percent)}%` : undefined}
      data-slot="progress-circular"
      data-variant={variant}
      data-effect={effect}
      data-size={size}
      data-state={stateOf(percent)}
      className={cn("relative inline-grid shrink-0 place-items-center", SIZE_CLASS[size], className)}
      {...props}
    >
      <svg aria-hidden="true" viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`} className="absolute inset-0 size-full">
        <CircularMarks variant={variant} percent={percent} steps={Math.max(MIN_STEPS, Math.floor(steps))} spring={effect === "spring"} reduceMotion={reduceMotion} />
      </svg>
      {children ?? valueText}
      {variant === "gauge" && size === "lg" && label ? (
        <span aria-hidden="true" data-slot="progress-circular-label" className="absolute bottom-0 max-w-[64%] truncate text-[13px] leading-4 text-muted-foreground">
          {label}
        </span>
      ) : null}
    </div>
  )
}

export {
  ProgressCircular,
  type ProgressCircularProps,
  type CircularVariant as ProgressCircularVariant,
  type ProgressCircularEffect,
  type ProgressCircularSize,
}
