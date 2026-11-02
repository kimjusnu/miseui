import type * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"
import { cn } from "@/registry/miseui/lib/utils"

/** No hover delay: a tooltip that waits feels like the UI is ignoring the cursor. */
const DEFAULT_DELAY_MS = 0
/** Gap between the trigger and the tooltip, in px. */
const SIDE_OFFSET_PX = 4

const PLAIN_MOTION_CLASS = [
  "animate-in fade-in-0 zoom-in-95 duration-(--duration-fast) ease-(--ease-mise)",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
  "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
  "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
]

/**
 * The enter runs unconditionally: a tooltip's open states are `delayed-open` and `instant-open`, never `open`.
 * The enter and exit values stay unqualified so the media overrides below win on source order.
 */
const MATERIALIZE_CLASS = [
  "duration-(--duration-base) ease-(--ease-mise-out) will-change-[transform,opacity,filter]",
  "animate-in data-[state=closed]:animate-out",
  "fade-in-0 zoom-in-75 blur-in-xs fade-out-0 zoom-out-75 blur-out-xs",
  "motion-reduce:zoom-in-100 motion-reduce:zoom-out-100 motion-reduce:blur-in-0 motion-reduce:blur-out-0",
  "[@media(prefers-reduced-transparency:reduce)]:blur-in-0 [@media(prefers-reduced-transparency:reduce)]:blur-out-0",
]

type TooltipEffect = "materialize"

function TooltipProvider({
  delayDuration = DEFAULT_DELAY_MS,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

type TooltipContentProps = React.ComponentProps<typeof TooltipPrimitive.Content> & {
  /** `materialize` grows the hint out of its trigger with scale, blur and opacity together. */
  effect?: TooltipEffect
}

function TooltipContent({ className, sideOffset = SIDE_OFFSET_PX, children, effect, ...props }: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        data-effect={effect}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-fit max-w-xs rounded-md bg-primary px-3 py-1.5 text-xs text-balance text-primary-foreground",
          "origin-(--radix-tooltip-content-transform-origin)",
          effect === "materialize" ? MATERIALIZE_CLASS : PLAIN_MOTION_CLASS,
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="z-50 size-2.5 fill-primary" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, type TooltipEffect, type TooltipContentProps }
