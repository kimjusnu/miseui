import type * as React from "react"
import { useState } from "react"
import { Slider as SliderPrimitive } from "radix-ui"
import {
  composePointer,
  resolveMarks,
  SliderMarks,
  toPercent,
  useRubberStretch,
  type SliderMark,
} from "@/registry/miseui/ui/slider-parts"
import { HALF_THUMB_PX, SliderStage, type SliderVariant } from "@/registry/miseui/ui/slider-stage"
import { cn } from "@/registry/miseui/lib/utils"

type SliderEffect = "rubber"

type SliderProps = Omit<React.ComponentProps<typeof SliderPrimitive.Root>, "orientation" | "inverted"> & {
  /** `plain` thin line, `filled` thick track with the thumb inside, `stepped` ticks and labels, `label` value bubble. */
  variant?: SliderVariant
  /** `rubber` stretches the slider with resistance when dragged past an end. */
  effect?: SliderEffect
  /** Ticks for `stepped`. Omitted, they are worked out from `step`. */
  marks?: readonly SliderMark[]
  /** Text for the bubble, the tick labels and assistive tech. */
  formatValue?: (value: number) => string
}

const ROOT_CLASS = "relative flex w-full touch-none flex-col select-none data-disabled:opacity-50"

/** Mirrors Radix's own state, because fill, ticks and bubble have to know the value in React. */
function useTrackedValues({ value, defaultValue, onValueChange }: SliderProps, min: number) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? [min])
  return {
    values: value ?? uncontrolled,
    onValueChange: (next: number[]) => {
      setUncontrolled(next)
      onValueChange?.(next)
    },
  }
}

function Slider({
  variant = "plain",
  effect,
  marks,
  formatValue = String,
  className,
  min = 0,
  max = 100,
  step = 1,
  "aria-label": label,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  ...props
}: SliderProps) {
  const { values, onValueChange } = useTrackedValues(props, min)
  const percents = values.map((entry) => toPercent(entry, min, max))
  const rubber = useRubberStretch(effect === "rubber" && !props.disabled)
  const stage = { variant, values, percents, formatValue, rubber, thumbAria: { label, labelledBy, describedBy } }
  const scale = { min, max, halfThumb: HALF_THUMB_PX[variant] }
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      data-variant={variant}
      data-effect={effect}
      className={cn(ROOT_CLASS, variant === "label" && "pt-8", className)}
      min={min}
      max={max}
      step={step}
      {...props}
      {...composePointer(props, rubber.handlers)}
      onValueChange={onValueChange}
    >
      <SliderStage {...stage} />
      {variant === "stepped" ? (
        <SliderMarks
          {...scale}
          marks={resolveMarks(marks, { min, max, step, format: formatValue })}
          low={values.length > 1 ? values[0] : min}
          high={values[values.length - 1]}
          values={values}
        />
      ) : null}
    </SliderPrimitive.Root>
  )
}

export { Slider, type SliderProps, type SliderVariant, type SliderEffect, type SliderMark }
