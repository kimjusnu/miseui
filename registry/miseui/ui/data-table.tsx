import type * as React from "react"
import { filterRows, type DataTableColumn } from "@/registry/miseui/ui/data-table-math"
import { useDataTable, type DataTableState, type DataTableStateOptions } from "@/registry/miseui/ui/data-table-state"
import { DataTableToolbar, type DataTableLabels } from "@/registry/miseui/ui/data-table-toolbar"
import { DataTableCards, DataTableTable } from "@/registry/miseui/ui/data-table-views"
import { Pagination } from "@/registry/miseui/ui/pagination"
import type { TableVariant } from "@/registry/miseui/ui/table"
import { cn } from "@/registry/miseui/lib/utils"

type DataTableVariant = "plain" | "card" | "compact" | "cards"
type DataTableEffect = "spring"

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_SKELETON_ROWS = 5

const DEFAULT_LABELS: DataTableLabels = {
  filter: "Filter rows",
  columns: "Show or hide columns",
  sort: "Sort rows",
  unsorted: "Sort",
  ascending: "ascending",
  descending: "descending",
  clearSelection: "Clear",
  clearFilter: "Clear filter",
  selectPage: "Select all on this page",
  selectRow: (row) => `Select ${row}`,
  selectedCount: (count) => `${count} selected`,
  range: (from, to, total) => (total === 0 ? "No rows" : `${from} to ${to} of ${total}`),
  noMatch: (query) => `No rows match "${query}".`,
  loading: "Loading rows",
}

const TABLE_VARIANT: Record<DataTableVariant, TableVariant> = { plain: "plain", card: "card", compact: "compact", cards: "plain" }

interface DataTableProps<Row> extends Omit<DataTableStateOptions<Row>, "pageSize" | "getRowId">, Omit<React.ComponentProps<"div">, "children" | "defaultValue"> {
  /** Names the table for assistive tech. */
  label: string
  /** Without it, the row's `id` field. */
  getRowId?: (row: Row) => string
  pageSize?: number
  /** `plain` hairlines on the page, `card` one framed surface, `compact` dense rows for scanning, `cards` turns rows into cards in a narrow container. */
  variant?: DataTableVariant
  /** `spring` slides one highlight between rows as the pointer or focus moves. */
  effect?: DataTableEffect
  /** Adds checkboxes. */
  selectable?: boolean
  /** Replaces the filter row while rows are selected. Gets every selected row, on any page. */
  bulkActions?: (rows: readonly Row[], clear: () => void) => React.ReactNode
  /** Extra controls beside the filter. */
  actions?: React.ReactNode
  loading?: boolean
  /** Skeleton rows while loading. */
  loadingRows?: number
  /** Shown when there is no data at all. A filter with no match gets its own message and a way out. */
  emptyText?: string
  labels?: Partial<DataTableLabels>
}

const readId = <Row,>(row: Row) => String((row as { id?: unknown }).id)

function Footer<Row>({ table, labels, loading, className }: { table: DataTableState<Row>; labels: DataTableLabels; loading: boolean; className?: string }) {
  // While loading or empty the body already says so, and a count under it would only contradict the skeleton.
  if (loading || table.total === 0) return null
  return (
    <div data-slot="data-table-footer" className={cn("flex flex-wrap items-center justify-between gap-2", className)}>
      <p className="text-[13px] text-muted-foreground tabular-nums">{labels.range(table.range.from, table.range.to, table.total)}</p>
      {table.pageCount > 1 ? <Pagination variant="simple" page={table.page} pageCount={table.pageCount} onPageChange={table.setPage} /> : null}
    </div>
  )
}

function DataTable<Row>({
  label,
  rows,
  columns,
  getRowId = readId,
  pageSize = DEFAULT_PAGE_SIZE,
  variant = "plain",
  effect,
  selectable = false,
  bulkActions,
  actions,
  loading = false,
  loadingRows = DEFAULT_SKELETON_ROWS,
  emptyText = "Nothing here yet.",
  labels: labelOverrides,
  className,
  defaultSort, locale, query, defaultQuery, onQueryChange, selected, defaultSelected, onSelectedChange, hiddenColumns, defaultHiddenColumns, onHiddenColumnsChange,
  ...props
}: DataTableProps<Row>) {
  const stateOptions = { defaultSort, locale, query, defaultQuery, onQueryChange, selected, defaultSelected, onSelectedChange, hiddenColumns, defaultHiddenColumns, onHiddenColumnsChange }
  const table = useDataTable({ rows, columns, getRowId, pageSize, ...stateOptions })
  const labels = { ...DEFAULT_LABELS, ...labelOverrides }
  const framed = variant === "card"
  const cards = variant === "cards"
  const view = { table, labels, selectable, loading, loadingRows, emptyText }
  const tableView = (
    <DataTableTable {...view} variant={TABLE_VARIANT[variant]} effect={effect} label={label} className={cn(framed && "rounded-none border-0 bg-transparent", cards && "hidden @md:block")} />
  )
  return (
    <div
      data-slot="data-table"
      data-variant={variant}
      data-effect={effect}
      aria-busy={loading || undefined}
      className={cn("@container grid w-full min-w-0 grid-cols-[minmax(0,1fr)]", framed ? "rounded-lg border bg-background" : "gap-3", className)}
      {...props}
    >
      <DataTableToolbar table={table} labels={labels} compact={variant === "compact"} cards={cards} bulkActions={bulkActions} actions={actions} className={cn(framed && "border-b p-3")} />
      {tableView}
      {cards ? <DataTableCards {...view} className="@md:hidden" /> : null}
      <Footer table={table} labels={labels} loading={loading} className={cn(framed && "border-t px-3 py-2")} />
      {loading ? (
        <span role="status" className="sr-only">
          {labels.loading}
        </span>
      ) : null}
    </div>
  )
}

export { DataTable, filterRows, type DataTableColumn, type DataTableEffect, type DataTableLabels, type DataTableProps, type DataTableVariant }
