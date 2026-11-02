import type * as React from "react"

export type AccordionVariant = "plain" | "card" | "separated" | "flush"
export type AccordionEffect = "spring"
export type AccordionIconName = "chevron" | "plus"
export type AccordionValue = string | string[]

export const ROOT_CLASS: Record<AccordionVariant, string> = {
  plain: "w-full",
  card: "w-full divide-y divide-border overflow-hidden rounded-lg border border-border bg-card text-card-foreground",
  separated: "grid w-full gap-2",
  flush: "w-full",
}

export const ITEM_CLASS: Record<AccordionVariant, string> = {
  plain: "border-b border-border last:border-b-0",
  card: "",
  separated:
    "rounded-lg border border-border bg-card text-card-foreground transition-shadow duration-(--duration-base) ease-(--ease-mise) data-[state=open]:shadow-sm",
  flush: "",
}

export const TRIGGER_CLASS: Record<AccordionVariant, string> = {
  plain: "min-h-11 py-3 text-sm font-medium hover:text-foreground/70",
  card: "min-h-11 rounded-none px-4 py-3 text-sm font-medium hover:bg-accent/60",
  separated: "min-h-11 rounded-lg px-4 py-3 text-sm font-medium hover:bg-accent/60",
  flush: "min-h-12 py-4 text-lg font-medium tracking-tight hover:text-foreground/70",
}

export const PANEL_CLASS: Record<AccordionVariant, string> = {
  plain: "pb-4 text-sm/6 text-muted-foreground",
  card: "px-4 pb-4 text-sm/6 text-muted-foreground",
  separated: "px-4 pb-4 text-sm/6 text-muted-foreground",
  flush: "pb-4 text-[15px]/6 text-muted-foreground",
}

interface AccordionLook {
  /** `plain` hairlines, `card` one container, `separated` one card per row, `flush` large type with no borders. */
  variant?: AccordionVariant
  /** `spring` animates height from wherever it is now, so a second click mid-flight reverses instead of jumping. */
  effect?: AccordionEffect
  /** Defaults to `plus` on `flush` and `chevron` elsewhere. */
  icon?: AccordionIconName
  disabled?: boolean
  orientation?: "horizontal" | "vertical"
  dir?: "ltr" | "rtl"
}

type AccordionSelection =
  | {
      type?: "single"
      /** Whether the open row can be closed again. On by default: a row that cannot close surprises people. */
      collapsible?: boolean
      value?: string
      defaultValue?: string
      onValueChange?: (value: string) => void
    }
  | {
      type: "multiple"
      collapsible?: never
      value?: string[]
      defaultValue?: string[]
      onValueChange?: (value: string[]) => void
    }

export type AccordionProps = Omit<React.ComponentProps<"div">, "defaultValue" | "dir"> & AccordionLook & AccordionSelection

export function toOpenList(value: AccordionValue | undefined): string[] {
  if (Array.isArray(value)) return value
  return value ? [value] : []
}
