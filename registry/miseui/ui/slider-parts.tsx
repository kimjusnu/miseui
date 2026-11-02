import type * as React from "react"
import { useRef, useState } from "react"
import { animate, useMotionValue, useReducedMotion, useTransform } from "motion/react"
import { rubberband, SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

interface SliderMark {
  value: number
  label?: React.ReactNode
}

type StretchSide = "left" | "right"

const MAX_AUTO_TICKS = 11
const MAX_AUTO_LABELS = 6
/** The track gets thinner as it stretches, the way a rubber band does; a quarter of the stretch keeps it subtle. */
const SQUASH_FACTOR = 0.25

/**
 * Radix keeps a thumb inside the track by pulling it inward as it nears an end, so its centre is not at
 * `percent`. Fill and ticks use the same formula to meet the thumb's centre exactly. In px past `percent`.
 */
function thumbCentreOffset(percent: number, halfThumb: number) {
  return halfThumb * (1 - percent / 50)
}

function thumbCentre(percent: number, halfThumb: number) {
  return `calc(${percent}% + ${thumbCentreOffset(percent, halfThumb)}px)`
}

function toPercent(value: number, min: number, max: number) {
  if (max === min) return 0
  return ((value - min) / (max - min)) * 100
}

/** Evenly spaced ticks from the step, thinned to a countable number; labels only where they can all fit. */
function resolveMarks(
  marks: readonly SliderMark[] | undefined,
  { min, max, step, format }: { min: number; max: number; step: number; format: (value: number) => React.ReactNode },
): readonly SliderMark[] {
  if (marks) return marks
  const intervals = Math.max(1, Math.round((max - min) / step))
  const stride = Math.ceil(intervals / (MAX_AUTO_TICKS - 1))
  const count = Math.floor(intervals / stride) + 1
  const labelAll = count <= MAX_AUTO_LABELS
  return Array.from({ length: count }, (_, index) => {
    const value = min + index * stride * step
    const showLabel = labelAll || index === 0 || index === count - 1
    return { value, label: showLabel ? format(value) : undefined }
  })
}

interface SliderMarksProps {
  marks: readonly SliderMark[]
  min: number
  max: number
  halfThumb: number
  /** Everything between these is inside the selected range. */
  low: number
  high: number
  values: readonly number[]
}

function SliderMarks({ marks, min, max, halfThumb, low, high, values }: SliderMarksProps) {
  return (
    // The touch stage is taller than the track; pull the marks back up so they still read as part of it.
    <span data-slot="slider-marks" className="relative block h-8 w-full pointer-coarse:-mt-2">
      {marks.map((mark) => {
        const percent = toPercent(mark.value, min, max)
        const inRange = mark.value >= low && mark.value <= high
        return (
          <span key={mark.value}>
            <span
              data-slot="slider-tick"
              className={cn("absolute top-0 h-2 w-px -translate-x-1/2", inRange ? "bg-foreground/60" : "bg-border")}
              style={{ insetInlineStart: thumbCentre(percent, halfThumb) }}
            />
            {mark.label === undefined ? null : (
              // Anchored by percent, so the first and last labels end flush with the track instead of overflowing it.
              <span
                data-current={values.includes(mark.value) ? "true" : "false"}
                className="absolute top-3 text-[13px] leading-5 whitespace-nowrap text-muted-foreground tabular-nums data-[current=true]:font-medium data-[current=true]:text-foreground"
                style={{ insetInlineStart: `${percent}%`, transform: `translateX(-${percent}%)` }}
              >
                {mark.label}
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

/** Stretches the slider past its ends while dragging. Pointer moves arrive here because Radix captures the pointer. */
function useRubberStretch(enabled: boolean) {
  const reduceMotion = useReducedMotion() ?? false
  const active = enabled && !reduceMotion
  const overshoot = useMotionValue(0)
  const scaleX = useTransform(overshoot, (ratio) => 1 + Math.abs(ratio))
  const scaleY = useTransform(overshoot, (ratio) => 1 - Math.abs(ratio) * SQUASH_FACTOR)
  // Keyed on the sign, not on state, so the origin holds still while the release spring settles back.
  const originX = useTransform(overshoot, (ratio) => (ratio < 0 ? 1 : 0))
  const [side, setSide] = useState<StretchSide | null>(null)
  const dragRect = useRef<DOMRect | null>(null)

  const handlers = {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (active) dragRect.current = event.currentTarget.getBoundingClientRect()
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      const rect = dragRect.current
      if (!rect || rect.width === 0) return
      const past =
        event.clientX < rect.left ? event.clientX - rect.left : event.clientX > rect.right ? event.clientX - rect.right : 0
      overshoot.set(rubberband(past, rect.width) / rect.width)
      setSide(past === 0 ? null : past < 0 ? "left" : "right")
    },
    onPointerEnd: () => {
      if (!dragRect.current) return
      dragRect.current = null
      setSide(null)
      animate(overshoot, 0, SPRING_DEFAULT)
    },
  }
  return { active, side, style: { scaleX, scaleY, originX }, handlers }
}

type RubberHandlers = ReturnType<typeof useRubberStretch>["handlers"]
type PointerProps = Pick<
  React.ComponentProps<"span">,
  "onPointerDown" | "onPointerMove" | "onPointerUp" | "onPointerCancel"
>

/** The owner's handlers run first, like Radix's own composition. */
function composePointer(owner: PointerProps, rubber: RubberHandlers): PointerProps {
  return {
    onPointerDown: (event) => {
      owner.onPointerDown?.(event)
      rubber.onPointerDown(event)
    },
    onPointerMove: (event) => {
      owner.onPointerMove?.(event)
      rubber.onPointerMove(event)
    },
    onPointerUp: (event) => {
      owner.onPointerUp?.(event)
      rubber.onPointerEnd()
    },
    onPointerCancel: (event) => {
      owner.onPointerCancel?.(event)
      rubber.onPointerEnd()
    },
  }
}

export {
  composePointer,
  resolveMarks,
  SliderMarks,
  thumbCentre,
  thumbCentreOffset,
  toPercent,
  useRubberStretch,
  type SliderMark,
}
