import type * as React from "react"
import { useContext, useEffect, useMemo, useRef, useState } from "react"
import { TableContext, type TableVariant } from "@/registry/miseui/ui/table-context"
import { TableHead, TableSortHead, type TableHeadProps, type TableSortHeadProps } from "@/registry/miseui/ui/table-head"
import { RowHighlight, useRowHighlight } from "@/registry/miseui/ui/table-highlight"
import {
  nextSort,
  sortRows,
  useTableSelection,
  useTableSort,
  type SortAccessor,
  type SortDirection,
  type TableSort,
} from "@/registry/miseui/ui/table-state"
import { cn } from "@/registry/miseui/lib/utils"

type TableEffect = "spring"

const SCROLLER_CLASS: Record<TableVariant, string> = {
  plain: "",
  striped: "",
  card: "rounded-lg border bg-card",
  compact: "",
}

const CELL_CLASS: Record<TableVariant, string> = {
  plain: "h-12 px-3",
  striped: "h-12 px-3 first:rounded-l-md last:rounded-r-md",
  card: "h-14 px-4",
  compact: "h-8 px-2 pointer-coarse:h-10",
}

/** Row lines sit on the cells: `border-separate` is what lets a sticky head keep its own line while scrolling. */
const ROW_LINE_CLASS = "[tbody_&:not(:last-child)>td]:border-b"
const ROW_CLASS: Record<TableVariant, string> = {
  plain: ROW_LINE_CLASS,
  striped: "[tbody_&]:odd:bg-muted",
  card: ROW_LINE_CLASS,
  compact: "",
}

const ROW_HOVER_CLASS = "transition-colors duration-(--duration-fast) ease-(--ease-mise) [tbody_&]:hover:bg-accent"

/** A scroller with nothing focusable inside cannot be reached by keyboard, so it becomes a tab stop once it overflows. */
function useOverflowing(ref: React.RefObject<HTMLDivElement | null>) {
  const [overflowing, setOverflowing] = useState(false)
  useEffect(() => {
    const element = ref.current
    // A test environment without it should get a plain table, not a crash.
    if (!element || typeof ResizeObserver === "undefined") return
    const check = () => {
      setOverflowing(element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight)
    }
    const observer = new ResizeObserver(check)
    observer.observe(element)
    // The scroller keeps its size when rows arrive, so the table has to be watched too.
    const table = element.querySelector("table")
    if (table) observer.observe(table)
    return () => observer.disconnect()
  }, [ref])
  return overflowing
}

type TableProps = React.ComponentProps<"div"> & {
  /** `plain` hairlines, `striped` alternate rows, `card` a framed surface with a tinted head, `compact` dense rows. */
  variant?: TableVariant
  /** `spring` slides one highlight between rows as the pointer or focus moves. */
  effect?: TableEffect
  /** Keeps the head in view. Give the table a height too, such as `className="max-h-80"`. */
  stickyHeader?: boolean
  /** Goes on the `<table>` itself. `className` goes on the scrolling root. */
  tableClassName?: string
  /** Names the scroll area for assistive tech when it overflows. */
  scrollLabel?: string
  /** Names the `<table>`. A TableCaption does the same with visible text. */
  label?: string
}

function Table({ variant = "plain", effect, stickyHeader = false, tableClassName, scrollLabel = "Table", label, className, children, ...props }: TableProps) {
  const scroller = useRef<HTMLDivElement>(null)
  const overflowing = useOverflowing(scroller)
  const spring = effect === "spring"
  const highlight = useRowHighlight(spring)
  const context = useMemo(() => ({ variant, sticky: stickyHeader, spring }), [variant, stickyHeader, spring])
  return (
    <TableContext.Provider value={context}>
      <div
        ref={scroller}
        data-slot="table"
        data-variant={variant}
        data-effect={effect}
        role={overflowing ? "region" : undefined}
        aria-label={overflowing ? scrollLabel : undefined}
        tabIndex={overflowing ? 0 : undefined}
        className={cn("relative w-full overflow-auto outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", SCROLLER_CLASS[variant], className)}
        {...props}
        {...highlight.handlers}
      >
        {spring ? <RowHighlight state={highlight.state} /> : null}
        <table
          aria-label={label}
          data-slot="table-element"
          className={cn("relative z-1 w-full border-separate border-spacing-0 text-left", variant === "compact" ? "text-[13px]" : "text-sm", tableClassName)}
        >
          {children}
        </table>
      </div>
    </TableContext.Provider>
  )
}

function TableHeader(props: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" {...props} />
}

function TableBody(props: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" {...props} />
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return <tfoot data-slot="table-footer" className={cn("font-medium [&_td]:border-t", className)} {...props} />
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return <caption data-slot="table-caption" className={cn("mt-3 caption-bottom text-[13px] text-muted-foreground", className)} {...props} />
}

type TableRowProps = React.ComponentProps<"tr"> & {
  /** Tints the row. The Checkbox in the row is what tells assistive tech. */
  selected?: boolean
}

function TableRow({ selected = false, className, ...props }: TableRowProps) {
  const { variant, spring } = useContext(TableContext)
  return (
    <tr
      data-slot="table-row"
      data-selected={selected ? "true" : undefined}
      // With the spring on, the sliding band already says which row is under the pointer.
      className={cn(!spring && ROW_HOVER_CLASS, ROW_CLASS[variant], "data-[selected=true]:bg-mise-soft!", className)}
      {...props}
    />
  )
}

type TableCellProps = React.ComponentProps<"td"> & {
  /** Right-aligned tabular figures, so digits of equal place line up down the column. */
  numeric?: boolean
}

function TableCell({ numeric = false, className, ...props }: TableCellProps) {
  const { variant } = useContext(TableContext)
  return <td data-slot="table-cell" className={cn(CELL_CLASS[variant], numeric && "text-right tabular-nums", className)} {...props} />
}

type TableEmptyProps = Omit<React.ComponentProps<"td">, "colSpan"> & {
  /** How many columns the message spans. */
  colSpan: number
}

function TableEmpty({ colSpan, className, ...props }: TableEmptyProps) {
  return (
    <tr data-slot="table-empty">
      <td colSpan={colSpan} className={cn("h-32 px-4 text-center text-sm text-muted-foreground", className)} {...props} />
    </tr>
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableCaption,
  TableRow,
  TableHead,
  TableSortHead,
  TableCell,
  TableEmpty,
  useTableSort,
  useTableSelection,
  sortRows,
  nextSort,
  type TableProps,
  type TableRowProps,
  type TableHeadProps,
  type TableSortHeadProps,
  type TableCellProps,
  type TableVariant,
  type TableEffect,
  type TableSort,
  type SortAccessor,
  type SortDirection,
}
