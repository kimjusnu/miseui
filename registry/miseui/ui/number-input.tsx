import type * as React from "react"
import { ChevronDown, ChevronUp, Minus, Plus } from "lucide-react"
import { fittedFontSize } from "@/registry/miseui/ui/number-input-math"
import { RollingText, StepButton } from "@/registry/miseui/ui/number-input-parts"
import { useNumberInputState, type NumberInputState, type NumberInputStateOptions } from "@/registry/miseui/ui/number-input-state"
import { cn } from "@/registry/miseui/lib/utils"

type NumberInputVariant = "plain" | "split" | "stepper-pill" | "large"
type NumberInputEffect = "roll"

const FOCUS_RING_CLASS =
  "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 has-[[aria-invalid=true]]:border-destructive"
const FRAME_CLASS = "h-9 w-full overflow-hidden rounded-md border border-input shadow-xs pointer-coarse:h-10"
const QUIET_STEP_CLASS = "text-muted-foreground hover:bg-accent hover:text-foreground"

const ROOT_CLASS: Record<NumberInputVariant, string> = {
  plain: cn("flex items-stretch", FRAME_CLASS, FOCUS_RING_CLASS),
  split: cn("flex items-stretch divide-x divide-input", FRAME_CLASS, FOCUS_RING_CLASS),
  "stepper-pill": "inline-flex h-9 w-fit items-center gap-1 rounded-full bg-muted p-1 focus-within:ring-[3px] focus-within:ring-ring/50 pointer-coarse:h-10",
  large: "flex w-full max-w-xs items-center justify-between gap-4",
}

const TEXT_CLASS: Record<NumberInputVariant, string> = {
  plain: "px-3 text-base md:text-sm",
  split: "px-2 text-base md:text-sm",
  "stepper-pill": "text-base font-medium md:text-sm",
  large: "text-5xl font-medium tracking-tight",
}

const FIELD_CLASS: Record<NumberInputVariant, string> = {
  plain: "text-left",
  split: "text-center",
  "stepper-pill": "text-center",
  large: "h-12 rounded-md text-center focus-visible:ring-[3px] focus-visible:ring-ring/50",
}

const STEP_CLASS: Record<NumberInputVariant, string> = {
  plain: cn("w-7 flex-1 pointer-coarse:w-10", QUIET_STEP_CLASS),
  split: cn("w-9 pointer-coarse:w-10", QUIET_STEP_CLASS),
  "stepper-pill":
    "size-7 rounded-full bg-background text-foreground shadow-xs hover:bg-background/70 pointer-coarse:size-8 pointer-coarse:after:absolute pointer-coarse:after:-inset-1",
  large: "size-10 rounded-full border border-input text-foreground hover:bg-accent",
}

type NumberInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type" | "min" | "max" | "step" | "size" | "children"
> &
  Pick<NumberInputStateOptions, "value" | "defaultValue" | "onValueChange" | "min" | "max" | "step" | "largeStep" | "locale" | "format"> & {
    /** `plain` chevrons at the end, `split` minus and plus on both sides, `stepper-pill` compact pill, `large` one big number. */
    variant?: NumberInputVariant
    /** `roll` turns the digits like an odometer when the value changes, and steps aside while someone types. */
    effect?: NumberInputEffect
    incrementLabel?: string
    decrementLabel?: string
    /** A line under the number on `large`, such as the unit. */
    caption?: React.ReactNode
  }

/** A phone keypad with no minus key would trap anyone who needs a negative number. */
function keypadFor(min: number | undefined, step = 1) {
  if (min === undefined || min < 0) return "text"
  return step % 1 === 0 ? "numeric" : "decimal"
}

interface NumberFieldProps {
  state: NumberInputState
  variant: NumberInputVariant
  roll: boolean
  bounds: { min?: number; max?: number; step?: number }
  inputProps: Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "min" | "max" | "step" | "size" | "children">
}

function NumberField({ state, variant, roll, bounds, inputProps }: NumberFieldProps) {
  const { style, onBlur, onKeyDown, ...rest } = inputProps
  const rolling = roll && state.draft === null && state.formatted !== ""
  // The pill hugs its digits. Without a width an input keeps its default 20 characters and the pill stops being compact.
  const width = variant === "stepper-pill" ? { width: `${Math.max(state.text.length, 2) + 1}ch` } : undefined
  const fit = variant === "large" ? { fontSize: fittedFontSize(state.text.length) } : undefined
  return (
    <span className={cn("relative block min-w-0", variant === "stepper-pill" ? "shrink-0" : "flex-1", fit && "@container")}>
      <input
        {...rest}
        type="text"
        role="spinbutton"
        inputMode={keypadFor(bounds.min, bounds.step)}
        autoComplete="off"
        aria-valuenow={state.current ?? undefined}
        aria-valuemin={bounds.min}
        aria-valuemax={bounds.max}
        aria-valuetext={state.formatted || undefined}
        data-slot="number-input-field"
        value={state.text}
        style={{ ...width, ...fit, ...style }}
        className={cn(
          "h-full w-full min-w-0 bg-transparent tabular-nums outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed",
          TEXT_CLASS[variant],
          FIELD_CLASS[variant],
          rolling && "text-transparent caret-foreground",
        )}
        onChange={state.onChange}
        onBlur={(event) => {
          state.onBlur()
          onBlur?.(event)
        }}
        onKeyDown={(event) => {
          state.onKeyDown(event)
          onKeyDown?.(event)
        }}
      />
      {rolling ? <RollingText text={state.formatted} style={fit} className={cn(TEXT_CLASS[variant], variant === "plain" ? "justify-start" : "justify-center")} /> : null}
    </span>
  )
}

function NumberInput({
  variant = "plain",
  effect,
  incrementLabel = "Increase",
  decrementLabel = "Decrease",
  caption,
  name,
  className,
  ...props
}: NumberInputProps) {
  const { value, defaultValue, onValueChange, min, max, step, largeStep, locale, format, ...inputProps } = props
  const { disabled = false, readOnly = false } = inputProps
  const state = useNumberInputState({ value, defaultValue, onValueChange, min, max, step, largeStep, locale, format, readOnly, disabled })
  const stepClass = STEP_CLASS[variant]
  const plain = variant === "plain"
  const decrease = (
    <StepButton aria-label={decrementLabel} disabled={disabled || readOnly || state.atMin} className={stepClass} onStep={state.decrement}>
      {plain ? <ChevronDown /> : <Minus />}
    </StepButton>
  )
  const increase = (
    <StepButton aria-label={incrementLabel} disabled={disabled || readOnly || state.atMax} className={stepClass} onStep={state.increment}>
      {plain ? <ChevronUp /> : <Plus />}
    </StepButton>
  )
  const field = <NumberField state={state} variant={variant} roll={effect === "roll"} bounds={{ min, max, step }} inputProps={inputProps} />
  return (
    <div data-slot="number-input" data-variant={variant} data-effect={effect} className={cn(ROOT_CLASS[variant], disabled && "cursor-not-allowed opacity-50", className)}>
      {name ? <input type="hidden" name={name} value={state.current ?? ""} disabled={disabled} /> : null}
      {plain ? field : decrease}
      {variant === "large" ? (
        <span className="grid min-w-0 flex-1 gap-1 text-center">
          {field}
          {caption ? <span className="text-[13px] text-muted-foreground">{caption}</span> : null}
        </span>
      ) : null}
      {variant === "split" || variant === "stepper-pill" ? field : null}
      {plain ? (
        <span className="flex flex-col-reverse divide-y divide-y-reverse divide-input border-l border-input pointer-coarse:flex-row pointer-coarse:divide-x pointer-coarse:divide-y-0">
          {decrease}
          {increase}
        </span>
      ) : (
        increase
      )}
    </div>
  )
}

export { NumberInput, type NumberInputProps, type NumberInputVariant, type NumberInputEffect }
