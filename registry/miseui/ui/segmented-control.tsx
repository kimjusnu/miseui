import type * as React from "react"
import { createContext, useContext, useId, useMemo, useState } from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { LayoutGroup, motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type SegmentedControlVariant = "plain" | "pill" | "underline" | "icon"
type SegmentedControlEffect = "spring"

const INSTANT = { duration: 0 } as const

/** Equal tracks, so the thumb keeps its size in flight and its corners stay undistorted. */
const ROOT_CLASS: Record<SegmentedControlVariant, string> = {
  plain: "isolate inline-grid max-w-full auto-cols-fr grid-flow-col gap-1 rounded-lg bg-muted p-1",
  pill: "isolate inline-grid max-w-full auto-cols-fr grid-flow-col gap-1",
  underline: "isolate inline-grid max-w-full auto-cols-fr grid-flow-col border-b",
  icon: "isolate inline-grid max-w-full auto-cols-fr grid-flow-col gap-1 rounded-lg border p-1",
}

const ITEM_CLASS: Record<SegmentedControlVariant, string> = {
  plain: "h-8 rounded-md px-3 pointer-coarse:h-10",
  pill: "h-8 rounded-full px-3 pointer-coarse:h-10",
  underline: "h-10 px-3",
  icon: "size-8 rounded-md pointer-coarse:size-10 [&_svg]:size-4",
}

const ITEM_ON_CLASS: Record<SegmentedControlVariant, string> = {
  plain: "data-[state=checked]:text-foreground",
  pill: "data-[state=checked]:text-primary-foreground",
  underline: "data-[state=checked]:text-foreground",
  icon: "data-[state=checked]:text-mise-foreground",
}

/** Lighter than the track in dark mode: `bg-background` there would be a dark hole, not a raised thumb. */
const THUMB_CLASS: Record<SegmentedControlVariant, string> = {
  plain: "inset-0 rounded-[inherit] bg-background shadow-sm dark:bg-accent dark:shadow-black/30",
  pill: "inset-0 rounded-[inherit] bg-primary",
  underline: "inset-x-0 -bottom-px h-0.5 bg-foreground",
  icon: "inset-0 rounded-[inherit] bg-mise",
}

interface SegmentedContextValue {
  variant: SegmentedControlVariant
  value: string | null | undefined
  animated: boolean
}

const SegmentedContext = createContext<SegmentedContextValue>({ variant: "plain", value: undefined, animated: false })

type SegmentedControlProps = React.ComponentProps<typeof RadioGroupPrimitive.Root> & {
  /** `plain` a thumb in a track, `pill` separate chips, `underline` a line under the text, `icon` square glyphs. Give `icon` items an aria-label. */
  variant?: SegmentedControlVariant
  /** `spring` slides one thumb between the options and follows the option when the control resizes. */
  effect?: SegmentedControlEffect
}

function SegmentedControl({ variant = "plain", effect, className, value, defaultValue, onValueChange, ...props }: SegmentedControlProps) {
  // layoutId is global to the page; without a per-instance group two controls would fight over one thumb.
  const groupId = useId()
  const reduceMotion = useReducedMotion() ?? false
  const [uncontrolled, setUncontrolled] = useState<string | null | undefined>(defaultValue)
  const current = value !== undefined ? value : uncontrolled
  const animated = effect === "spring" && !reduceMotion
  const context = useMemo(() => ({ variant, value: current, animated }), [variant, current, animated])
  return (
    <SegmentedContext.Provider value={context}>
      <LayoutGroup id={groupId}>
        <RadioGroupPrimitive.Root
          data-slot="segmented-control"
          data-variant={variant}
          data-effect={effect}
          orientation="horizontal"
          className={cn(ROOT_CLASS[variant], className)}
          value={current}
          onValueChange={(next) => {
            setUncontrolled(next)
            onValueChange?.(next)
          }}
          {...props}
        />
      </LayoutGroup>
    </SegmentedContext.Provider>
  )
}

function Thumb({ variant, animated }: { variant: SegmentedControlVariant; animated: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      data-slot="segmented-control-thumb"
      // Mounted inside the chosen option and sized by it, not measured from outside, so no resize can leave it behind.
      layoutId={animated ? "segmented-control-thumb" : undefined}
      transition={animated ? SPRING_DEFAULT : INSTANT}
      className={cn("absolute -z-10", THUMB_CLASS[variant])}
    />
  )
}

function SegmentedControlItem({ value, className, children, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  const { variant, value: current, animated } = useContext(SegmentedContext)
  return (
    <RadioGroupPrimitive.Item
      data-slot="segmented-control-item"
      value={value}
      className={cn(
        "relative inline-flex min-w-0 items-center justify-center gap-2 text-sm font-medium whitespace-nowrap text-muted-foreground outline-none select-none",
        "transition-[color,scale,box-shadow] duration-(--duration-fast) ease-(--ease-mise) enabled:hover:text-foreground",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.97] active:duration-100 motion-reduce:active:scale-100",
        "disabled:cursor-not-allowed disabled:opacity-50",
        ITEM_CLASS[variant],
        ITEM_ON_CLASS[variant],
        className,
      )}
      {...props}
    >
      {current === value ? <Thumb variant={variant} animated={animated} /> : null}
      {children}
    </RadioGroupPrimitive.Item>
  )
}

export { SegmentedControl, SegmentedControlItem, type SegmentedControlProps, type SegmentedControlVariant, type SegmentedControlEffect }
