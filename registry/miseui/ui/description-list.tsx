import type * as React from "react"
import { createContext, useContext } from "react"
import { cn } from "@/registry/miseui/lib/utils"

type DescriptionListVariant = "stacked" | "columns" | "inline" | "card"

const ROOT_CLASS: Record<DescriptionListVariant, string> = {
  stacked: "grid grid-cols-[minmax(0,1fr)] divide-y",
  columns: "grid grid-cols-2 gap-x-6 gap-y-4",
  inline: "grid grid-cols-[minmax(0,1fr)] gap-2",
  card: "grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-2",
}

const ITEM_CLASS: Record<DescriptionListVariant, string> = {
  stacked: "grid content-start gap-1 py-3 first:pt-0 last:pb-0",
  columns: "grid content-start gap-1",
  inline: "flex items-baseline justify-between gap-4",
  card: "grid content-start gap-1 rounded-lg border bg-background p-3",
}

const TERM_CLASS: Record<DescriptionListVariant, string> = {
  stacked: "",
  columns: "",
  inline: "max-w-1/2 shrink-0",
  card: "",
}

const DETAIL_CLASS: Record<DescriptionListVariant, string> = {
  stacked: "text-sm leading-5",
  columns: "text-sm leading-5",
  inline: "justify-end text-right text-sm leading-5",
  card: "text-[15px] leading-6 font-medium",
}

/**
 * Quiet until the row is hovered or focused, and always there on touch, where hover does not exist. The negative
 * margin lets a 32 or 40 px control sit on a 20 px line without making its row taller than the ones around it.
 */
const ACTION_CLASS = cn(
  "-my-1.5 flex shrink-0 items-center pointer-coarse:-my-2.5",
  "opacity-0 transition-opacity duration-(--duration-fast) ease-(--ease-mise)",
  "group-hover/item:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100",
)

const DescriptionListContext = createContext<DescriptionListVariant>("stacked")

type DescriptionListProps = React.ComponentProps<"dl"> & {
  /** `stacked` ruled rows, `columns` a two column grid, `inline` label and value on one line, `card` a tile per item. */
  variant?: DescriptionListVariant
}

function DescriptionList({ variant = "stacked", className, ...props }: DescriptionListProps) {
  return (
    <DescriptionListContext.Provider value={variant}>
      <dl data-slot="description-list" data-variant={variant} className={cn("w-full min-w-0", ROOT_CLASS[variant], className)} {...props} />
    </DescriptionListContext.Provider>
  )
}

type DescriptionItemProps = Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode
  /** The value. Long text wraps inside the item and never widens the list. */
  children: React.ReactNode
  /** A small control after the value, usually a copy button. */
  action?: React.ReactNode
}

function DescriptionItem({ label, children, action, className, ...props }: DescriptionItemProps) {
  const variant = useContext(DescriptionListContext)
  return (
    <div data-slot="description-item" className={cn("group/item min-w-0", ITEM_CLASS[variant], className)} {...props}>
      <dt data-slot="description-term" className={cn("text-[13px] leading-5 text-muted-foreground", TERM_CLASS[variant])}>
        {label}
      </dt>
      <dd data-slot="description-detail" className={cn("flex min-w-0 items-start gap-2 text-foreground", DETAIL_CLASS[variant])}>
        <div data-slot="description-value" className="min-w-0 wrap-anywhere">
          {children}
        </div>
        {action ? (
          <div data-slot="description-action" className={ACTION_CLASS}>
            {action}
          </div>
        ) : null}
      </dd>
    </div>
  )
}

export { DescriptionList, DescriptionItem, type DescriptionListProps, type DescriptionItemProps, type DescriptionListVariant }
