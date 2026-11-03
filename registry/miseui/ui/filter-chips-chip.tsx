import type * as React from "react"
import { motion } from "motion/react"
import { Check } from "lucide-react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type FilterChipsVariant = "pills" | "underline" | "list"

const CHIP_CLASS: Record<FilterChipsVariant, string> = {
  pills: "h-8 shrink-0 rounded-full border px-3 pointer-coarse:h-10",
  underline: "h-10 shrink-0 px-3 whitespace-nowrap",
  list: "h-8 w-full justify-between rounded-md px-2 text-start pointer-coarse:h-10",
}

const PRESSED_CLASS: Record<FilterChipsVariant, string> = {
  pills: "border-transparent text-background",
  underline: "font-medium text-foreground",
  list: "font-medium text-foreground",
}

const REST_CLASS: Record<FilterChipsVariant, string> = {
  pills: "text-muted-foreground hover:border-foreground/30 hover:text-foreground",
  underline: "text-muted-foreground hover:text-foreground",
  list: "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
}

const MARKER_CLASS: Record<FilterChipsVariant, string> = {
  pills: "inset-0 -z-10 rounded-full bg-foreground",
  // Sits on the inset hairline of the row, inside the scroller, so the scroller does not clip it.
  underline: "inset-x-3 bottom-0 h-0.5 bg-mise",
  list: "inset-0 -z-10 rounded-md bg-accent",
}

interface ChipProps {
  variant: FilterChipsVariant
  label: React.ReactNode
  count?: number
  pressed: boolean
  disabled: boolean
  /** One marker travels between chips. Only makes sense when one chip at a time can be pressed. */
  travelling: boolean
  showCheck: boolean
  onClick: () => void
  buttonRef?: React.Ref<HTMLButtonElement>
}

function ChipMarker({ variant, travelling }: { variant: FilterChipsVariant; travelling: boolean }) {
  const className = cn("pointer-events-none absolute", MARKER_CLASS[variant])
  if (!travelling) return <span aria-hidden="true" data-slot="filter-chips-marker" className={className} />
  return <motion.span aria-hidden="true" data-slot="filter-chips-marker" layoutId="filter-chips-marker" className={className} transition={SPRING_DEFAULT} />
}

function Chip({ variant, label, count, pressed, disabled, travelling, showCheck, onClick, buttonRef }: ChipProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      data-slot="filter-chips-chip"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative isolate inline-flex min-w-0 items-center gap-2 text-[13px] leading-5 outline-none",
        "transition-colors duration-(--duration-fast) ease-(--ease-mise) active:duration-0",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-50",
        CHIP_CLASS[variant],
        pressed ? PRESSED_CLASS[variant] : REST_CLASS[variant],
      )}
    >
      {pressed ? <ChipMarker variant={variant} travelling={travelling} /> : null}
      <span className="flex min-w-0 items-center gap-2">
        {variant === "list" && showCheck ? (
          <span aria-hidden="true" className={cn("flex size-4 shrink-0 items-center justify-center rounded-sm border", pressed && "border-transparent bg-foreground text-background")}>
            {pressed ? <Check className="size-3" /> : null}
          </span>
        ) : null}
        <span className="min-w-0 truncate">{label}</span>
      </span>
      {count === undefined ? null : (
        <span data-slot="filter-chips-count" className="shrink-0 text-xs tabular-nums opacity-70">
          {count}
        </span>
      )}
    </button>
  )
}

export { Chip, type FilterChipsVariant }
