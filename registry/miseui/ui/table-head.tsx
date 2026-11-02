import type * as React from "react"
import { useContext } from "react"
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react"
import { TableContext, type TableVariant } from "@/registry/miseui/ui/table-context"
import type { SortDirection } from "@/registry/miseui/ui/table-state"
import { cn } from "@/registry/miseui/lib/utils"

const HEAD_CLASS: Record<TableVariant, string> = {
  plain: "h-10 border-b px-3",
  striped: "h-10 px-3",
  card: "h-10 border-b bg-muted px-4",
  compact: "h-8 border-b px-2 pointer-coarse:h-10",
}

/** With the button's own 6 px this adds up to the variant's cell padding, so a sortable label lines up with its column. */
const SORT_HEAD_PADDING: Record<TableVariant, string> = {
  plain: "px-1.5",
  striped: "px-1.5",
  card: "px-2.5",
  compact: "px-0.5",
}

type TableHeadProps = React.ComponentProps<"th"> & {
  /** Right-aligns the head over a column of figures. */
  numeric?: boolean
}

function TableHead({ numeric = false, className, ...props }: TableHeadProps) {
  const { variant, sticky } = useContext(TableContext)
  return (
    <th
      scope="col"
      data-slot="table-head"
      className={cn(
        "text-[13px] font-medium whitespace-nowrap text-muted-foreground",
        numeric ? "text-right" : "text-left",
        HEAD_CLASS[variant],
        sticky && cn("sticky top-0 z-10", variant === "card" ? "bg-muted" : "bg-background"),
        className,
      )}
      {...props}
    />
  )
}

function SortIcon({ direction }: { direction: SortDirection | "none" }) {
  if (direction === "ascending") return <ChevronUp aria-hidden="true" className="size-3.5 shrink-0" />
  if (direction === "descending") return <ChevronDown aria-hidden="true" className="size-3.5 shrink-0" />
  // Keeps its place while hidden, so the label does not shift when the column gets sorted.
  return (
    <ChevronsUpDown
      aria-hidden="true"
      className="size-3.5 shrink-0 opacity-0 transition-opacity duration-(--duration-fast) group-hover/sort:opacity-100 group-focus-visible/sort:opacity-100 pointer-coarse:opacity-60"
    />
  )
}

type TableSortHeadProps = Omit<TableHeadProps, "onClick"> & {
  direction?: SortDirection | "none"
  onSort?: () => void
}

function TableSortHead({ direction = "none", onSort, numeric = false, className, children, ...props }: TableSortHeadProps) {
  const { variant } = useContext(TableContext)
  const icon = <SortIcon direction={direction} />
  return (
    <TableHead numeric={numeric} aria-sort={direction} className={cn(SORT_HEAD_PADDING[variant], className)} {...props}>
      <button
        type="button"
        data-slot="table-sort"
        className={cn(
          "group/sort inline-flex min-h-8 max-w-full items-center gap-1 rounded-sm px-1.5 font-medium outline-none pointer-coarse:min-h-10",
          "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:text-foreground",
          "focus-visible:ring-[3px] focus-visible:ring-ring/50",
          direction !== "none" && "text-foreground",
        )}
        onClick={onSort}
      >
        {/* On a right-aligned column the icon goes first, so the label stays flush above the figures. */}
        {numeric ? icon : null}
        {children}
        {numeric ? null : icon}
      </button>
    </TableHead>
  )
}

export { TableHead, TableSortHead, type TableHeadProps, type TableSortHeadProps }
