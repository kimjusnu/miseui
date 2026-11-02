import type * as React from "react"
import { useState } from "react"
import { Toggle as TogglePrimitive } from "radix-ui"
import { Check } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type ToggleVariant = "plain" | "outline" | "pill" | "icon"
type ToggleEffect = "pop"

const POP_FROM_SCALE = 0.8

const ROOT_CLASS = [
  "group/toggle inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium select-none",
  "transition-[color,background-color,border-color,box-shadow,scale] duration-(--duration-fast) ease-(--ease-mise)",
  "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "active:scale-[0.97] active:duration-100 motion-reduce:active:scale-100",
  "disabled:pointer-events-none disabled:opacity-50",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
]

const VARIANT_CLASS: Record<ToggleVariant, string> = {
  plain: cn(
    "h-9 gap-2 rounded-md px-3 text-sm text-muted-foreground pointer-coarse:h-10",
    "hover:bg-accent hover:text-foreground data-[state=on]:bg-accent data-[state=on]:text-foreground",
  ),
  outline: cn(
    "h-9 gap-2 rounded-md border border-input px-3 text-sm text-muted-foreground shadow-xs pointer-coarse:h-10",
    "hover:text-foreground data-[state=on]:border-foreground data-[state=on]:text-foreground",
  ),
  pill: cn(
    "h-8 rounded-full border border-input px-3 text-[13px] text-muted-foreground pointer-coarse:h-10",
    "hover:text-foreground data-[state=on]:border-transparent data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:text-primary-foreground",
  ),
  icon: cn(
    "size-9 rounded-md text-muted-foreground pointer-coarse:size-10",
    "hover:bg-accent hover:text-foreground data-[state=on]:bg-mise data-[state=on]:text-mise-foreground data-[state=on]:hover:bg-mise/90 data-[state=on]:hover:text-mise-foreground",
  ),
}

/** Grows from zero width through the grid track, so a chip widens smoothly instead of pushing its neighbours in one jump. */
function PillCheck() {
  return (
    <span
      aria-hidden="true"
      data-slot="toggle-check"
      className="grid grid-cols-[0fr] transition-[grid-template-columns] duration-(--duration-fast) ease-(--ease-mise) group-data-[state=on]/toggle:grid-cols-[1fr] motion-reduce:transition-none"
    >
      <span className="overflow-hidden">
        <Check className="mr-1 size-3.5" />
      </span>
    </span>
  )
}

interface ToggleContentProps {
  pressed: boolean
  pop: boolean
  children: React.ReactNode
}

function ToggleContent({ pressed, pop, children }: ToggleContentProps) {
  const reduceMotion = useReducedMotion() ?? false
  const className = "inline-flex items-center gap-2"
  if (!pop || reduceMotion) return <span className={className}>{children}</span>
  return (
    <motion.span
      data-slot="toggle-pop"
      className={className}
      initial={false}
      // Only switching on earns the movement: it confirms a choice, and switching off should simply stop.
      animate={pressed ? { scale: [POP_FROM_SCALE, 1] } : { scale: 1 }}
      transition={SPRING_DEFAULT}
    >
      {children}
    </motion.span>
  )
}

type ToggleProps = React.ComponentProps<typeof TogglePrimitive.Root> & {
  /** `plain` quiet fill, `outline` border darkens, `pill` chip with a check, `icon` square in the accent. `icon` needs an aria-label. */
  variant?: ToggleVariant
  /** `pop` springs the content up when it switches on. */
  effect?: ToggleEffect
}

function Toggle({
  variant = "plain",
  effect,
  className,
  children,
  pressed,
  defaultPressed = false,
  onPressedChange,
  ...props
}: ToggleProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultPressed)
  const current = pressed ?? uncontrolled
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      data-variant={variant}
      data-effect={effect}
      className={cn(ROOT_CLASS, VARIANT_CLASS[variant], className)}
      pressed={current}
      onPressedChange={(next) => {
        setUncontrolled(next)
        onPressedChange?.(next)
      }}
      {...props}
    >
      {variant === "pill" ? <PillCheck /> : null}
      <ToggleContent pressed={current} pop={effect === "pop"}>
        {children}
      </ToggleContent>
    </TogglePrimitive.Root>
  )
}

export { Toggle, type ToggleProps, type ToggleVariant, type ToggleEffect }
