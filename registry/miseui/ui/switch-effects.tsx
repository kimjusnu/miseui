import type * as React from "react"
import { useEffect, useId, useState } from "react"
import { Switch as SwitchPrimitive } from "radix-ui"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT, SPRING_PRESS } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

/**
 * Track 36 x 20 px with 2 px padding, thumb 16 px: the thumb travels exactly 16 px
 * (translate-x-4) between the two ends, so the on and off positions are unambiguous.
 */
const TRACK_CLASS = "h-5 w-9 p-0.5"
const THUMB_CLASS = "size-4"
const THUMB_TRAVEL_PX = 16

const SWITCH_ROOT_CLASS = [
  TRACK_CLASS,
  "peer inline-flex shrink-0 items-center rounded-full shadow-xs",
  "transition-[background-color,box-shadow] duration-(--duration-fast) ease-(--ease-mise)",
  "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
  "disabled:cursor-not-allowed disabled:opacity-50",
]
const SWITCH_THUMB_CLASS = [
  THUMB_CLASS,
  "pointer-events-none block rounded-full bg-background",
  "dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground",
]
/** The accent carries the "on" state; the thumb turns dark on it so it stays readable in both themes. */
const EFFECT_TRACK_CLASS = "data-[state=checked]:bg-mise"
const EFFECT_THUMB_CLASS =
  "transition-colors duration-(--duration-fast) ease-(--ease-mise) data-[state=checked]:bg-mise-foreground dark:data-[state=checked]:bg-mise-foreground"

/** The tail arrives late on the same critically damped curve; the gap between head and tail is the stretch. */
const TAIL_SPRING = { ...SPRING_DEFAULT, duration: 0.7 }
const GOOEY_BLUR_PX = 1.6
const ALPHA_SLOPE = 18
const ALPHA_OFFSET = -7
const HAPTIC_DIP_SCALE = 0.9

type SwitchRootProps = React.ComponentProps<typeof SwitchPrimitive.Root>

/** Mirrors Radix's own state, because the thumb's target position has to be known in React. */
function useTrackedChecked({ checked, defaultChecked, onCheckedChange }: SwitchRootProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultChecked ?? false)
  return {
    on: checked ?? uncontrolled,
    onCheckedChange: (next: boolean) => {
      setUncontrolled(next)
      onCheckedChange?.(next)
    },
  }
}

function GooeySwitch({ className, checked, defaultChecked, onCheckedChange, ...props }: SwitchRootProps) {
  const reduceMotion = useReducedMotion() ?? false
  const filterId = `switch-gooey-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  const tracked = useTrackedChecked({ checked, defaultChecked, onCheckedChange })
  const x = tracked.on ? THUMB_TRAVEL_PX : 0

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-effect="gooey"
      className={cn(SWITCH_ROOT_CLASS, EFFECT_TRACK_CLASS, "relative", className)}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={tracked.onCheckedChange}
      {...props}
    >
      {reduceMotion ? null : <GooeyFilter id={filterId} />}
      {/* The filter spans the whole track: a filter region is measured from its element and would clip a travelling thumb. */}
      <span className="absolute inset-0.5 block" style={reduceMotion ? undefined : { filter: `url(#${filterId})` }}>
        {reduceMotion ? null : (
          <motion.span
            aria-hidden="true"
            data-slot="switch-tail"
            data-state={tracked.on ? "checked" : "unchecked"}
            className={cn(SWITCH_THUMB_CLASS, EFFECT_THUMB_CLASS, "absolute top-0.5 left-0.5 size-3")}
            initial={false}
            animate={{ x }}
            transition={TAIL_SPRING}
          />
        )}
        <SwitchPrimitive.Thumb asChild data-slot="switch-thumb">
          <motion.span
            className={cn(SWITCH_THUMB_CLASS, EFFECT_THUMB_CLASS, "absolute top-0 left-0")}
            initial={false}
            animate={{ x }}
            transition={reduceMotion ? { duration: 0 } : SPRING_DEFAULT}
          />
        </SwitchPrimitive.Thumb>
      </span>
    </SwitchPrimitive.Root>
  )
}

function GooeyFilter({ id }: { id: string }) {
  return (
    <svg aria-hidden="true" className="absolute size-0">
      <defs>
        <filter id={id} x="-25%" y="-50%" width="150%" height="200%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation={GOOEY_BLUR_PX} result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${ALPHA_SLOPE} ${ALPHA_OFFSET}`}
          />
        </filter>
      </defs>
    </svg>
  )
}

function usePressed() {
  const [pressed, setPressed] = useState(false)
  useEffect(() => {
    if (!pressed) return undefined
    // The pointer can lift outside the control; listen on window so the thumb never stays dipped.
    const release = () => setPressed(false)
    window.addEventListener("pointerup", release)
    window.addEventListener("pointercancel", release)
    return () => {
      window.removeEventListener("pointerup", release)
      window.removeEventListener("pointercancel", release)
    }
  }, [pressed])
  return [pressed, setPressed] as const
}

function HapticSwitch({
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  onPointerDown,
  onKeyDown,
  onKeyUp,
  onBlur,
  ...props
}: SwitchRootProps) {
  const reduceMotion = useReducedMotion() ?? false
  const tracked = useTrackedChecked({ checked, defaultChecked, onCheckedChange })
  const [pressed, setPressed] = usePressed()
  const dipped = pressed && !reduceMotion

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-effect="haptic"
      data-pressed={pressed ? "true" : undefined}
      className={cn(
        SWITCH_ROOT_CLASS,
        EFFECT_TRACK_CLASS,
        "data-[pressed=true]:ring-4 data-[pressed=true]:ring-mise/25",
        className,
      )}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={tracked.onCheckedChange}
      disabled={disabled}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (!disabled) setPressed(true)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.key === " " || event.key === "Enter") setPressed(true)
      }}
      onKeyUp={(event) => {
        onKeyUp?.(event)
        setPressed(false)
      }}
      onBlur={(event) => {
        onBlur?.(event)
        setPressed(false)
      }}
      {...props}
    >
      <SwitchPrimitive.Thumb asChild data-slot="switch-thumb">
        <motion.span
          className={cn(SWITCH_THUMB_CLASS, EFFECT_THUMB_CLASS, "shadow-xs")}
          initial={false}
          animate={{ x: tracked.on ? THUMB_TRAVEL_PX : 0, scale: dipped ? HAPTIC_DIP_SCALE : 1 }}
          transition={
            reduceMotion ? { duration: 0 } : { x: SPRING_DEFAULT, scale: dipped ? SPRING_PRESS : SPRING_DEFAULT }
          }
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}

export { GooeySwitch, HapticSwitch, SWITCH_ROOT_CLASS, SWITCH_THUMB_CLASS, type SwitchRootProps }
