import type * as React from "react"
import { Check } from "lucide-react"
import { motion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type RadioGroupVariant = "plain" | "card" | "segmented" | "list"

/**
 * `auto-rows-fr` and the equal-width segments keep every option the same size, so a flying indicator
 * never changes scale and its border and corners stay undistorted in the air, whatever the theme radius.
 */
const ROOT_CLASS: Record<RadioGroupVariant, string> = {
  plain: "grid gap-2 pointer-coarse:gap-0",
  card: "grid auto-rows-fr grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-2",
  segmented: "isolate inline-grid max-w-full auto-cols-fr grid-flow-col gap-1 rounded-lg bg-muted p-1",
  list: "isolate grid divide-y overflow-hidden rounded-lg border",
}

const ITEM_BASE_CLASS = [
  "outline-none transition-[color,background-color,border-color,box-shadow] duration-(--duration-fast) ease-(--ease-mise)",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50",
]

const ITEM_CLASS: Record<RadioGroupVariant, string> = {
  plain: "relative mt-0.5 size-4 shrink-0 rounded-full border border-input shadow-xs pointer-coarse:mt-0",
  card: "relative flex items-start justify-between gap-3 rounded-lg border p-4 text-left shadow-xs enabled:hover:bg-accent/50",
  // No overflow clipping here: it would hide the indicator while it flies in from a neighbour.
  segmented:
    "relative h-8 min-w-0 rounded-md px-3 text-sm font-medium text-muted-foreground enabled:hover:text-foreground data-[state=checked]:text-foreground pointer-coarse:h-10",
  list: "relative flex min-h-12 w-full items-center justify-between gap-3 px-3 py-2 text-left enabled:hover:bg-accent/50 focus-visible:ring-inset",
}

const INDICATOR_CLASS: Record<RadioGroupVariant, string> = {
  plain: "absolute -inset-px flex items-center justify-center rounded-full bg-mise",
  card: "pointer-events-none absolute -inset-px rounded-[inherit] border-2 border-mise",
  segmented: "absolute inset-0 -z-10 rounded-[inherit] bg-background shadow-sm",
  list: "absolute inset-0 -z-10 bg-accent",
}

const PLAIN_LABEL_CLASS =
  "flex items-start gap-2 has-disabled:cursor-not-allowed has-disabled:opacity-50 pointer-coarse:min-h-10 pointer-coarse:items-center"

interface RadioIndicatorProps {
  variant: RadioGroupVariant
  animated: boolean
  reduceMotion: boolean
}

function RadioIndicator({ variant, animated, reduceMotion }: RadioIndicatorProps) {
  return (
    <motion.span
      aria-hidden="true"
      data-slot="radio-group-indicator"
      data-reduced={reduceMotion ? "true" : "false"}
      layoutId={animated ? "radio-group-indicator" : undefined}
      transition={SPRING_DEFAULT}
      className={INDICATOR_CLASS[variant]}
    >
      {/* Mise can be pale; the dot in its foreground colour is what keeps the choice legible on any palette. */}
      {variant === "plain" ? <span className="size-1.5 rounded-full bg-mise-foreground" /> : null}
    </motion.span>
  )
}

interface ItemTextProps {
  labelId: string
  descriptionId: string
  description: React.ReactNode
  hideDescription: boolean
  children: React.ReactNode
}

function ItemText({ labelId, descriptionId, description, hideDescription, children }: ItemTextProps) {
  return (
    <span className="grid min-w-0 gap-1">
      <span id={labelId} className="block truncate text-sm leading-5 font-medium">
        {children}
      </span>
      {description ? (
        <span
          id={descriptionId}
          className={hideDescription ? "sr-only" : "block text-[13px] leading-5 font-normal text-muted-foreground"}
        >
          {description}
        </span>
      ) : null}
    </span>
  )
}

function SelectionCheck({ variant, selected }: { variant: RadioGroupVariant; selected: boolean }) {
  return (
    <span
      data-slot="radio-group-check"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-full",
        variant === "card" && "mt-0.5 border border-input shadow-xs",
        variant === "card" && selected && "border-mise bg-mise text-mise-foreground",
      )}
    >
      {selected ? <Check aria-hidden="true" className="size-3.5" strokeWidth={variant === "card" ? 3 : 2.5} /> : null}
    </span>
  )
}

export {
  ROOT_CLASS,
  ITEM_BASE_CLASS,
  ITEM_CLASS,
  PLAIN_LABEL_CLASS,
  RadioIndicator,
  ItemText,
  SelectionCheck,
  type RadioGroupVariant,
}
