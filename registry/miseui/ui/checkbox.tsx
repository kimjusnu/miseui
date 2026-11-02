import type * as React from "react"
import { useState } from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { Check } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

const ROOT_CLASS = [
  "peer size-4 shrink-0 rounded-sm border border-input shadow-xs",
  "transition-[color,background-color,border-color,box-shadow] duration-(--duration-fast) ease-(--ease-mise)",
  "outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
  "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
  "disabled:cursor-not-allowed disabled:opacity-50",
]

const DRAW_ROOT_CLASS = [
  "data-[state=checked]:border-mise data-[state=checked]:bg-mise data-[state=checked]:text-mise-foreground",
  "data-[state=indeterminate]:border-mise data-[state=indeterminate]:bg-mise data-[state=indeterminate]:text-mise-foreground",
]

const CHECK_PATH = "M3.25 8.5 6.5 11.75 12.75 4.5"
const DASH_PATH = "M4 8H12"
const STROKE_WIDTH = 2.25
/** A zero-length stroke with round caps still paints a dot, so the stroke fades once it has mostly retracted. */
const UNDRAW_FADE = { delay: 0.2, duration: 0.05 }
const REDUCED_TRANSITION = { pathLength: { duration: 0 }, opacity: { duration: 0.1 } }

type CheckboxEffect = "draw"
type CheckboxRootProps = React.ComponentProps<typeof CheckboxPrimitive.Root>
type CheckedValue = NonNullable<CheckboxRootProps["checked"]>

type CheckboxProps = CheckboxRootProps & {
  /** `draw` strokes the check on a spring, as if written by hand, and retracts it on the way out. */
  effect?: CheckboxEffect
}

function Checkbox({ effect, className, ...props }: CheckboxProps) {
  if (effect === "draw") return <DrawCheckbox className={className} {...props} />
  return (
    <CheckboxPrimitive.Root data-slot="checkbox" className={cn(ROOT_CLASS, className)} {...props}>
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current"
      >
        <Check className="size-3.5" aria-hidden="true" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

function DrawCheckbox({ className, checked, defaultChecked, onCheckedChange, ...props }: CheckboxRootProps) {
  const reduceMotion = useReducedMotion() ?? false
  // Mirrors Radix's own state, because the stroke's target length has to be known in React.
  const [uncontrolled, setUncontrolled] = useState<CheckedValue>(defaultChecked ?? false)
  const state = checked ?? uncontrolled

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      data-effect="draw"
      className={cn(ROOT_CLASS, DRAW_ROOT_CLASS, className)}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={(next) => {
        setUncontrolled(next)
        onCheckedChange?.(next)
      }}
      {...props}
    >
      {/* forceMount: Radix unmounts through CSS animations only, which would cut a retracting stroke short. */}
      <CheckboxPrimitive.Indicator
        forceMount
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="size-3.5">
          <DrawStroke part="check" d={CHECK_PATH} drawn={state === true} reduceMotion={reduceMotion} />
          <DrawStroke part="dash" d={DASH_PATH} drawn={state === "indeterminate"} reduceMotion={reduceMotion} />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

interface DrawStrokeProps {
  part: "check" | "dash"
  d: string
  drawn: boolean
  reduceMotion: boolean
}

function DrawStroke({ part, d, drawn, reduceMotion }: DrawStrokeProps) {
  return (
    <motion.path
      data-slot={`checkbox-${part}`}
      data-drawn={drawn ? "true" : "false"}
      d={d}
      stroke="currentColor"
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={false}
      animate={{ pathLength: drawn ? 1 : 0, opacity: drawn ? 1 : 0 }}
      transition={
        reduceMotion ? REDUCED_TRANSITION : { pathLength: SPRING_DEFAULT, opacity: drawn ? { duration: 0 } : UNDRAW_FADE }
      }
    />
  )
}

export { Checkbox, type CheckboxEffect, type CheckboxProps }
