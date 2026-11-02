import type * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"
import { cn } from "@/registry/miseui/lib/utils"

/**
 * Track 36 x 20 px with 2 px padding, thumb 16 px: the thumb travels exactly 16 px
 * (translate-x-4) between the two ends, so the on and off positions are unambiguous.
 */
const TRACK_CLASS = "h-5 w-9 p-0.5"
const THUMB_CLASS = "size-4"
const THUMB_TRAVEL_CLASS = "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        TRACK_CLASS,
        "peer inline-flex shrink-0 items-center rounded-full shadow-xs",
        "transition-[background-color,box-shadow] duration-(--duration-fast) ease-(--ease-mise)",
        "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          THUMB_CLASS,
          THUMB_TRAVEL_CLASS,
          "pointer-events-none block rounded-full bg-background shadow-xs",
          "dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground",
          "transition-transform duration-(--duration-fast) ease-(--ease-mise)",
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
