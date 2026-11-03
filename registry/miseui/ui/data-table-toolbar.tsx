import type * as React from "react"
import { useId } from "react"
import { Columns3, Search } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { Checkbox } from "@/registry/miseui/ui/checkbox"
import { sortFromOption, sortToOption } from "@/registry/miseui/ui/data-table-math"
import type { DataTableState } from "@/registry/miseui/ui/data-table-state"
import { Input } from "@/registry/miseui/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/miseui/ui/popover"
import { cn } from "@/registry/miseui/lib/utils"

interface DataTableLabels {
  filter: string
  columns: string
  sort: string
  unsorted: string
  ascending: string
  descending: string
  clearSelection: string
  clearFilter: string
  selectPage: string
  selectRow: (row: string) => string
  selectedCount: (count: number) => string
  range: (from: number, to: number, total: number) => string
  noMatch: (query: string) => string
  loading: string
}

function ColumnMenu<Row>({ table, label, compact }: { table: DataTableState<Row>; label: string; compact: boolean }) {
  const hideable = table.columns.filter((column) => column.hideable !== false)
  if (hideable.length === 0) return null
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-label={label} className={cn("shrink-0 pointer-coarse:size-10", compact && "size-8")}>
          <Columns3 aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1">
        <ul data-slot="data-table-columns" aria-label={label} className="grid grid-cols-[minmax(0,1fr)]">
          {hideable.map((column) => (
            <ColumnRow key={column.key} header={column.header} checked={!table.hidden.includes(column.key)} locked={table.isOnlyVisible(column.key)} onToggle={() => table.toggleColumn(column.key)} />
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

function ColumnRow({ header, checked, locked, onToggle }: { header: string; checked: boolean; locked: boolean; onToggle: () => void }) {
  const id = useId()
  return (
    <li>
      <label htmlFor={id} className={cn("flex h-8 items-center gap-2 rounded-sm px-2 text-[13px] pointer-coarse:h-10", locked ? "opacity-50" : "cursor-pointer hover:bg-accent")}>
        <Checkbox id={id} checked={checked} disabled={locked} onCheckedChange={onToggle} />
        <span className="min-w-0 truncate">{header}</span>
      </label>
    </li>
  )
}

/** Cards have no column heads to press, so a narrow container needs another way to sort. Native, because this is the phone layout. */
function CardSort<Row>({ table, labels }: { table: DataTableState<Row>; labels: DataTableLabels }) {
  const sortable = table.columns.filter((column) => column.sortable !== false)
  return (
    <select
      data-slot="data-table-sort"
      aria-label={labels.sort}
      value={sortToOption(table.sort)}
      onChange={(event) => table.setSort(sortFromOption(event.target.value))}
      className="h-9 max-w-28 min-w-0 shrink rounded-md border border-input bg-background px-2 text-[13px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:h-10 @md:hidden"
    >
      <option value="">{labels.unsorted}</option>
      {sortable.flatMap((column) => [
        <option key={`${column.key}:ascending`} value={`${column.key}:ascending`}>
          {`${column.header}, ${labels.ascending}`}
        </option>,
        <option key={`${column.key}:descending`} value={`${column.key}:descending`}>
          {`${column.header}, ${labels.descending}`}
        </option>,
      ])}
    </select>
  )
}

interface ToolbarProps<Row> {
  table: DataTableState<Row>
  labels: DataTableLabels
  compact: boolean
  cards: boolean
  /** Owner's actions on the chosen rows. Filled, the row of filters gives way to them while anything is selected. */
  bulkActions?: (rows: readonly Row[], clear: () => void) => React.ReactNode
  actions?: React.ReactNode
  className?: string
}

function DataTableToolbar<Row>({ table, labels, compact, cards, bulkActions, actions, className }: ToolbarProps<Row>) {
  const count = table.selected.length
  const rowClass = cn("flex min-h-9 flex-wrap items-center gap-2 pointer-coarse:min-h-10", compact && "min-h-8", className)
  if (bulkActions && count > 0) {
    return (
      <div data-slot="data-table-bulk" className={rowClass}>
        <p role="status" className="text-[13px] font-medium tabular-nums">
          {labels.selectedCount(count)}
        </p>
        <Button variant="ghost" size="sm" className="pointer-coarse:h-10" onClick={table.clearSelection}>
          {labels.clearSelection}
        </Button>
        <div className="ms-auto flex flex-wrap items-center gap-2">{bulkActions(table.selectedRows, table.clearSelection)}</div>
      </div>
    )
  }
  return (
    <div data-slot="data-table-toolbar" className={rowClass}>
      <div className="relative min-w-24 flex-1">
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label={labels.filter}
          placeholder={labels.filter}
          value={table.query}
          onChange={(event) => table.setQuery(event.target.value)}
          className={cn("pl-8 pointer-coarse:h-10", compact && "h-8 md:text-[13px]")}
        />
      </div>
      {cards ? <CardSort table={table} labels={labels} /> : null}
      {actions}
      <ColumnMenu table={table} label={labels.columns} compact={compact} />
    </div>
  )
}

export { DataTableToolbar, type DataTableLabels }
