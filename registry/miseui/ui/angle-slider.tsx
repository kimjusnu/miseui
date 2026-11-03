import type * as React from "react"
import { useMemo } from "react"
import type { MotionValue } from "motion/react"
import { useDial } from "@/registry/miseui/ui/angle-slider-state"
import type { DialRange } from "@/registry/miseui/ui/angle-slider-math"
import { DialRing, DialTicks, GaugeArc, Needle, RimThumb, type AngleSliderMark } from "@/registry/miseui/ui/angle-slider-parts"
import { cn } from "@/registry/miseui/lib/utils"

type AngleSliderVariant = "plain" | "ticks" | "compact" | "gauge"
type AngleSliderEffect = "spring"

const GAUGE_SWEEP = 270
const GAUGE_START = 225
const GAUGE_MAX = 100
const FULL_TURN = 360
/** One notch of a page key: a quarter of a quarter turn is what people reach for on a dial. */
const DEFAULT_PAGE_STEP = 15
const COMPASS_MARKS: readonly AngleSliderMark[] = [
  { value: 0, label: "0°" },
  { value: 90, label: "90°" },
  { value: 180, label: "180°" },
  { value: 270, label: "270°" },
]

const DIAL_CLASS: Record<AngleSliderVariant, string> = {
  plain: "size-32",
  ticks: "size-40",
  compact: "size-8 border bg-card shadow-xs pointer-coarse:size-10",
  gauge: "size-36",
}

type AngleSliderProps = Omit<React.ComponentProps<"div">, "onChange" | "defaultValue"> & {
  value?: number
  defaultValue?: number
  /** Fires on every change, drag included. */
  onValueChange?: (value: number) => void
  /** Fires once when the drag ends, or per key press. Save here. */
  onValueCommit?: (value: number) => void
  /** Defaults to 0. */
  min?: number
  /** Defaults to 360, or 100 on `gauge`. */
  max?: number
  step?: number
  /** PageUp and PageDown distance. */
  pageStep?: number
  /** Going past the end comes round to the start. Full circles only; on by default there. */
  wrap?: boolean
  /** `plain` ring and thumb, `ticks` a marked compass, `compact` a small knob beside its value, `gauge` a 270 degree meter. */
  variant?: AngleSliderVariant
  /** `spring` eases the thumb to a clicked spot. Dragging always follows the pointer one to one. */
  effect?: AngleSliderEffect
  /** Labelled positions. `ticks` defaults to the four compass points. */
  marks?: readonly AngleSliderMark[]
  /** What the value reads as on screen. */
  format?: (value: number) => string
  /** What it reads as for assistive tech. Defaults to `format`, or "45 degrees" on a full circle. */
  getValueText?: (value: number) => string
  disabled?: boolean
  /** Posts the value with the surrounding form. */
  name?: string
}

function rangeFor(variant: AngleSliderVariant, min: number, max: number): DialRange {
  const gauge = variant === "gauge"
  return { min, max, sweep: gauge ? GAUGE_SWEEP : FULL_TURN, start: gauge ? GAUGE_START : 0 }
}

interface DialFaceProps {
  variant: AngleSliderVariant
  range: DialRange
  rotation: MotionValue<number>
  marks?: readonly AngleSliderMark[]
  display: string
}

function DialFace({ variant, range, rotation, marks, display }: DialFaceProps) {
  const gauge = variant === "gauge"
  if (variant === "compact") return <Needle rotation={rotation} inset="top-[12%] h-[38%]" />
  return (
    <>
      {variant === "plain" ? <DialRing /> : null}
      {variant === "ticks" ? <DialTicks range={range} marks={marks ?? COMPASS_MARKS} /> : null}
      {gauge ? <GaugeArc range={range} rotation={rotation} /> : null}
      {variant === "ticks" ? <Needle rotation={rotation} inset="top-[2%] h-[16%]" /> : <RimThumb rotation={rotation} />}
      <output
        data-slot="angle-slider-value"
        className={cn(
          "pointer-events-none absolute inset-0 grid place-items-center tabular-nums",
          gauge ? "text-xl font-semibold tracking-tight" : "text-[15px] font-medium",
        )}
      >
        {display}
      </output>
    </>
  )
}

function AngleSlider({
  value: valueProp, defaultValue, onValueChange, onValueCommit, min = 0, max, step = 1, pageStep = DEFAULT_PAGE_STEP, wrap,
  variant = "plain", effect, marks, format, getValueText, disabled = false, name, className,
  "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, ...props
}: AngleSliderProps) {
  const gauge = variant === "gauge"
  const resolvedMax = max ?? (gauge ? GAUGE_MAX : FULL_TURN)
  const range = useMemo(() => rangeFor(variant, min, resolvedMax), [variant, min, resolvedMax])
  const dial = { value: valueProp, defaultValue, onValueChange, onValueCommit, range, step, pageStep, disabled }
  const { value, rotation, handlers } = useDial({ ...dial, wrap: wrap ?? !gauge, spring: effect === "spring" })
  const display = format ? format(value) : gauge ? String(value) : `${value}°`
  const spoken = getValueText?.(value) ?? (format || gauge ? display : `${value} degrees`)
  return (
    <div data-slot="angle-slider" data-variant={variant} data-effect={effect} className={cn("inline-flex max-w-full items-center gap-2", disabled && "opacity-50", className)} {...props}>
      {name ? <input type="hidden" name={name} value={value} disabled={disabled} /> : null}
      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-valuemin={range.min}
        aria-valuemax={range.max}
        aria-valuenow={value}
        aria-valuetext={spoken}
        aria-disabled={disabled || undefined}
        data-slot="angle-slider-dial"
        className={cn(
          "relative shrink-0 touch-none rounded-full outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
          DIAL_CLASS[variant],
        )}
        {...handlers}
      >
        <DialFace variant={variant} range={range} rotation={rotation} marks={marks} display={display} />
      </div>
      {variant === "compact" ? (
        <output data-slot="angle-slider-value" className="text-[13px] tabular-nums">
          {display}
        </output>
      ) : null}
    </div>
  )
}

export { AngleSlider, type AngleSliderProps, type AngleSliderVariant, type AngleSliderEffect, type AngleSliderMark }
