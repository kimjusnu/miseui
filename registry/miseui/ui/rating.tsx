import type * as React from "react"
import { useState } from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { useReducedMotion } from "motion/react"
import { ROOT_CLASS, defaultItemLabel, glyphFill, ratingSteps, type RatingStep, type RatingVariant } from "@/registry/miseui/ui/rating-parts"
import { RatingMarks } from "@/registry/miseui/ui/rating-rows"
import { cn } from "@/registry/miseui/lib/utils"

type RatingEffect = "pop"

type RatingProps = Omit<React.ComponentProps<"div">, "defaultValue" | "dir" | "onChange"> & {
  /** `stars` the familiar row with its score, `hearts` larger marks for liking, `numeric` a joined scale, `bar` a row of segments. */
  variant?: RatingVariant
  /** `pop` springs the mark that was just picked. */
  effect?: RatingEffect
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  max?: number
  /** 0.5 allows half marks. `numeric` always uses whole numbers, since half a digit means nothing. */
  step?: RatingStep
  readOnly?: boolean
  disabled?: boolean
  required?: boolean
  /** Posts the value with the surrounding form. */
  name?: string
  /** The spoken name of each value, for your language. */
  itemLabel?: (value: number, max: number) => string
}

function RatingScore({ variant, shown, max }: { variant: RatingVariant; shown: number; max: number }) {
  if (variant !== "stars" && variant !== "bar") return null
  const stars = variant === "stars"
  return (
    <span data-slot="rating-value" aria-hidden="true" className={cn("text-sm tabular-nums text-muted-foreground", stars && "ml-2 min-w-6")}>
      {stars ? shown || null : `${shown} / ${max}`}
    </span>
  )
}

/** Holds what is picked, what the pointer previews and how many picks have happened, which is what restarts the pop. */
function useRatingValue(value: number | undefined, defaultValue: number, pop: boolean, onValueChange?: (value: number) => void) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const [preview, setPreview] = useState<number | null>(null)
  const [pulse, setPulse] = useState(0)
  const reduceMotion = useReducedMotion() ?? false
  const pick = (next: string) => {
    const picked = Number(next)
    setUncontrolled(picked)
    setPreview(null)
    if (pop && !reduceMotion) setPulse((count) => count + 1)
    onValueChange?.(picked)
  }
  return { current: value ?? uncontrolled, preview, setPreview, pulse, pick }
}

function Rating({ variant = "stars", effect, value, defaultValue = 0, onValueChange, max = 5, step = 1, readOnly = false, disabled, required, name, itemLabel = defaultItemLabel, className, "aria-label": ariaLabel, ...props }: RatingProps) {
  const { current, preview, setPreview, pulse, pick } = useRatingValue(value, defaultValue, effect === "pop", onValueChange)
  const shown = readOnly ? current : (preview ?? current)
  const root = { ...props, "data-slot": "rating", "data-variant": variant, "data-effect": effect, "data-readonly": readOnly ? "true" : undefined }
  const shared = { variant, max, step: variant === "numeric" ? 1 : step, shown, picked: current, pulse, labelFor: itemLabel }
  if (readOnly) {
    const spoken = `${ariaLabel ? `${ariaLabel}: ` : ""}${itemLabel(current, max)}`
    return (
      <div {...root} role="img" aria-label={spoken} className={cn(ROOT_CLASS[variant], className)}>
        <RatingMarks {...shared} onPreview={null} />
        <RatingScore variant={variant} shown={shown} max={max} />
      </div>
    )
  }
  return (
    <RadioGroupPrimitive.Root
      {...root}
      aria-label={ariaLabel}
      name={name}
      required={required}
      disabled={disabled}
      // Radix treats "" as no selection, which is what a score of zero is.
      value={current > 0 ? String(current) : ""}
      className={cn(ROOT_CLASS[variant], disabled && "opacity-50", className)}
      onValueChange={pick}
      onPointerLeave={() => setPreview(null)}
    >
      <RatingMarks {...shared} onPreview={setPreview} />
      <RatingScore variant={variant} shown={shown} max={max} />
    </RadioGroupPrimitive.Root>
  )
}

export { Rating, glyphFill, ratingSteps, type RatingProps, type RatingVariant, type RatingEffect, type RatingStep }
