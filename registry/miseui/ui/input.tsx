import type * as React from "react"
import { cn } from "@/registry/miseui/lib/utils"

/** 36 px: the same height as Button, and comfortably above the 24 px minimum target. */
const INPUT_HEIGHT_CLASS = "h-9"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        INPUT_HEIGHT_CLASS,
        "w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs md:text-sm",
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "transition-[color,border-color,box-shadow] duration-(--duration-fast) ease-(--ease-mise)",
        "outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
