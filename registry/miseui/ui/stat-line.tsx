import type * as React from "react"
import { ArrowRight } from "lucide-react"
import { useReducedMotion } from "motion/react"
import { CountFigure } from "@/registry/miseui/ui/stat-line-count"
import { cn } from "@/registry/miseui/lib/utils"

type StatLineVariant = "divided" | "run" | "lead"
type StatLineEffect = "count-up"

interface StatLineItem {
  label: React.ReactNode
  /** A number can be formatted and counted; a string such as "4m 12s" is shown as it is. */
  value: number | string
  /** The value before, drawn in front of the new one: 98 to 50. */
  from?: number
  /** Written after the value, smaller. */
  unit?: string
}

const ROOT_CLASS: Record<StatLineVariant, string> = {
  divided: "grid grid-cols-2 gap-y-4 @xs:auto-cols-fr @xs:grid-flow-col @xs:grid-cols-none",
  run: "flex flex-wrap items-baseline gap-x-4 gap-y-1",
  // auto-fit keeps the tracks explicit, which is what lets the first figure span them all at any width.
  lead: "grid grid-cols-[repeat(auto-fit,minmax(min(100%,7rem),1fr))] gap-4",
}

/** A line runs between columns, never in front of the first in a row, and the row length changes with the width. */
const DIVIDED_ITEM = "min-w-0 border-s ps-4 odd:border-s-0 odd:ps-0 @xs:not-first:border-s @xs:not-first:ps-4"

const ITEM_CLASS: Record<StatLineVariant, string> = {
  divided: cn("grid content-start gap-1", DIVIDED_ITEM),
  run: "flex min-w-0 items-baseline gap-1",
  lead: "grid min-w-0 content-start gap-1 border-t pt-4 first:col-span-full first:border-t-0 first:pt-0",
}

const VALUE_CLASS: Record<StatLineVariant, string> = {
  divided: "text-[clamp(20px,9cqi,28px)] leading-tight font-semibold tracking-tight",
  run: "order-first text-[15px] leading-6 font-semibold",
  lead: "text-[clamp(20px,9cqi,28px)] leading-tight font-semibold tracking-tight",
}

const LEAD_VALUE_CLASS = "text-[clamp(40px,22cqi,72px)] leading-none font-semibold tracking-tighter"

const defaultFormat = (locale?: string) => (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 20 }).format(value)

interface FigureProps {
  item: StatLineItem
  format: (value: number) => string
  counting: boolean
}

function Figure({ item, format, counting }: FigureProps) {
  const { value, from, unit } = item
  const shown = typeof value === "number" ? format(value) : value
  return (
    <span data-slot="stat-line-figure" className="flex min-w-0 flex-wrap items-baseline gap-x-1 tabular-nums">
      {from === undefined ? null : (
        <span data-slot="stat-line-from" className="inline-flex items-center gap-1 text-[0.6em] font-medium tracking-normal text-muted-foreground">
          <span>{format(from)}</span>
          <ArrowRight aria-hidden="true" className="size-[1em] shrink-0 rtl:rotate-180" />
          <span className="sr-only">to</span>
        </span>
      )}
      <span className="min-w-0 wrap-anywhere">
        {counting && typeof value === "number" ? <CountFigure from={from ?? 0} to={value} format={format} /> : shown}
        {unit ? <span data-slot="stat-line-unit" className="ms-0.5 text-[0.6em] font-medium tracking-normal">{unit}</span> : null}
      </span>
    </span>
  )
}

type StatLineProps = Omit<React.ComponentProps<"div">, "children"> & {
  items: readonly StatLineItem[]
  /** `divided` equal columns with hairlines, `run` a sentence of figures that wraps, `lead` one big figure above the rest. */
  variant?: StatLineVariant
  /** `count-up` counts each number once when first seen. People who turned motion off get the final figure. */
  effect?: StatLineEffect
  /** Formats numeric values. Defaults to grouped digits in the given locale. */
  format?: (value: number) => string
  locale?: string
}

function StatLine({ items, variant = "divided", effect, format, locale, className, ...props }: StatLineProps) {
  const reduceMotion = useReducedMotion() ?? false
  const counting = effect === "count-up" && !reduceMotion
  const toText = format ?? defaultFormat(locale)
  return (
    // The container is the size-aware part, so the figures fit whatever cell this is dropped in.
    <div data-slot="stat-line" data-variant={variant} data-effect={effect} className={cn("@container w-full min-w-0", className)} {...props}>
      <dl className={ROOT_CLASS[variant]}>
        {items.map((item, index) => (
          <div key={index} data-slot="stat-line-item" className={ITEM_CLASS[variant]}>
            <dt className="min-w-0 text-[13px] leading-5 text-muted-foreground">{item.label}</dt>
            <dd className={cn("min-w-0", variant === "lead" && index === 0 ? LEAD_VALUE_CLASS : VALUE_CLASS[variant])}>
              <Figure item={item} format={toText} counting={counting} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export { StatLine, type StatLineItem, type StatLineProps, type StatLineVariant, type StatLineEffect }
