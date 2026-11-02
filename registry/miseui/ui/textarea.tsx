import type * as React from "react"
import { cn } from "@/registry/miseui/lib/utils"

/** 64 px: about three lines of room before any typing, so the field invites a real answer. */
const MIN_HEIGHT_CLASS = "min-h-16"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        MIN_HEIGHT_CLASS,
        "field-sizing-content flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs md:text-sm",
        "placeholder:text-muted-foreground",
        "transition-[color,border-color,box-shadow] duration-(--duration-fast) ease-(--ease-mise)",
        "outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
