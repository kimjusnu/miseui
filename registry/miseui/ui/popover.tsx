import type * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { cn } from "@/registry/miseui/lib/utils"

/** Gap between the anchor and the panel, in px. */
const SIDE_OFFSET_PX = 4

const PLAIN_MOTION_CLASS = [
  "duration-(--duration-fast) ease-(--ease-mise)",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
  "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
  "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
]

/** The enter and exit values stay unqualified so the media overrides below win on source order. */
const MATERIALIZE_CLASS = [
  "duration-(--duration-base) ease-(--ease-mise-out) will-change-[transform,opacity,filter]",
  "data-[state=open]:animate-in data-[state=closed]:animate-out",
  "fade-in-0 zoom-in-90 blur-in-sm fade-out-0 zoom-out-90 blur-out-sm",
  "motion-reduce:zoom-in-100 motion-reduce:zoom-out-100 motion-reduce:blur-in-0 motion-reduce:blur-out-0",
  "[@media(prefers-reduced-transparency:reduce)]:blur-in-0 [@media(prefers-reduced-transparency:reduce)]:blur-out-0",
]

type PopoverEffect = "materialize"

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

type PopoverContentProps = React.ComponentProps<typeof PopoverPrimitive.Content> & {
  /** `materialize` grows the panel out of its trigger with scale, blur and opacity together. */
  effect?: PopoverEffect
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = SIDE_OFFSET_PX,
  effect,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        data-effect={effect}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden",
          "origin-(--radix-popover-content-transform-origin)",
          effect === "materialize" ? MATERIALIZE_CLASS : PLAIN_MOTION_CLASS,
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, type PopoverEffect, type PopoverContentProps }
