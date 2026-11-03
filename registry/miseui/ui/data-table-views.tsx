import type * as React from "react"
import { Button } from "@/registry/miseui/ui/button"
import { Checkbox } from "@/registry/miseui/ui/checkbox"
import { columnText, type DataTableColumn } from "@/registry/miseui/ui/data-table-math"
import type { DataTableState } from "@/registry/miseui/ui/data-table-state"
import type { DataTableLabels } from "@/registry/miseui/ui/data-table-toolbar"
import { Skeleton } from "@/registry/miseui/ui/skeleton"
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow, TableSortHead, type TableVariant } from "@/registry/miseui/ui/table"
import { cn } from "@/registry/miseui/lib/utils"

const cellOf = <Row,>(column: DataTableColumn<Row>, row: Row): React.ReactNode => (column.cell ? column.cell(row) : columnText(column, row))

/** The label is the hit target: a 16 px box stays 16 px while the press area reaches 32, or 40 on touch. */
function SelectBox({ label, checked, onToggle }: { label: string; checked: boolean | "indeterminate"; onToggle: () => void }) {
  return (
    <label className="-mx-2 inline-flex size-8 cursor-pointer items-center justify-center align-middle pointer-coarse:size-10">
      <Checkbox aria-label={label} checked={checked} onCheckedChange={onToggle} />
    </label>
  )
}

interface ViewProps<Row> {
  table: DataTableState<Row>
  labels: DataTableLabels
  selectable: boolean
  loading: boolean
  loadingRows: number
  emptyText: string
}

function EmptyMessage<Row>({ table, labels, emptyText }: Pick<ViewProps<Row>, "table" | "labels" | "emptyText">) {
  if (!table.query) return <p>{emptyText}</p>
  return (
    <div className="grid justify-items-center gap-2">
      <p className="break-words">{labels.noMatch(table.query)}</p>
      <Button variant="outline" size="sm" className="pointer-coarse:h-10" onClick={() => table.setQuery("")}>
        {labels.clearFilter}
      </Button>
    </div>
  )
}

function HeadCell<Row>({ table, column }: { table: DataTableState<Row>; column: DataTableColumn<Row> }) {
  if (column.sortable === false) {
    return (
      <TableHead numeric={column.numeric} className={column.className}>
        {column.header}
      </TableHead>
    )
  }
  return (
    <TableSortHead numeric={column.numeric} className={column.className} direction={table.sort?.key === column.key ? table.sort.direction : "none"} onSort={() => table.cycleSort(column.key)}>
      {column.header}
    </TableSortHead>
  )
}

function SkeletonRows<Row>({ table, selectable, loadingRows }: Pick<ViewProps<Row>, "table" | "selectable" | "loadingRows">) {
  return Array.from({ length: loadingRows }, (_, index) => (
    <TableRow key={index} data-slot="data-table-skeleton" aria-hidden="true">
      {selectable ? (
        <TableCell className="w-10">
          <Skeleton className="size-4" />
        </TableCell>
      ) : null}
      {table.visibleColumns.map((column) => (
        <TableCell key={column.key} numeric={column.numeric}>
          <Skeleton className={cn("h-4 max-w-24", column.numeric && "ms-auto w-12")} />
        </TableCell>
      ))}
    </TableRow>
  ))
}

interface TableViewProps<Row> extends ViewProps<Row> {
  variant: TableVariant
  effect?: "spring"
  label: string
  className?: string
}

function DataRow<Row>({ row, table, labels, selectable }: Pick<ViewProps<Row>, "table" | "labels" | "selectable"> & { row: Row }) {
  const id = table.getRowId(row)
  const isSelected = table.selected.includes(id)
  const primary = table.visibleColumns[0]
  return (
    <TableRow selected={isSelected}>
      {selectable ? (
        <TableCell className="w-10">
          <SelectBox label={labels.selectRow(primary ? columnText(primary, row) : id)} checked={isSelected} onToggle={() => table.toggleRow(id)} />
        </TableCell>
      ) : null}
      {table.visibleColumns.map((column) => (
        <TableCell key={column.key} numeric={column.numeric} className={column.className}>
          {cellOf(column, row)}
        </TableCell>
      ))}
    </TableRow>
  )
}

function DataTableTable<Row>({ table, labels, selectable, loading, loadingRows, emptyText, variant, effect, label, className }: TableViewProps<Row>) {
  const colSpan = table.visibleColumns.length + (selectable ? 1 : 0)
  return (
    <Table variant={variant} effect={effect} label={label} className={className}>
      <TableHeader>
        <TableRow>
          {selectable ? (
            <TableHead className="w-10">
              <SelectBox label={labels.selectPage} checked={table.pageChecked} onToggle={table.togglePage} />
            </TableHead>
          ) : null}
          {table.visibleColumns.map((column) => (
            <HeadCell key={column.key} table={table} column={column} />
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? <SkeletonRows table={table} selectable={selectable} loadingRows={loadingRows} /> : null}
        {!loading && table.pageRows.length === 0 ? (
          <TableEmpty colSpan={colSpan}>
            <EmptyMessage table={table} labels={labels} emptyText={emptyText} />
          </TableEmpty>
        ) : null}
        {!loading ? table.pageRows.map((row) => <DataRow key={table.getRowId(row)} row={row} table={table} labels={labels} selectable={selectable} />) : null}
      </TableBody>
    </Table>
  )
}

function DataTableCard<Row>({ row, table, labels, selectable }: Pick<ViewProps<Row>, "table" | "labels" | "selectable"> & { row: Row }) {
  const id = table.getRowId(row)
  const isSelected = table.selected.includes(id)
  const [primary, ...rest] = table.visibleColumns
  return (
    <li data-slot="data-table-card" data-selected={isSelected ? "true" : undefined} className="grid grid-cols-[minmax(0,1fr)] gap-2 rounded-lg border bg-background p-3 data-[selected=true]:border-transparent data-[selected=true]:bg-mise-soft">
      <div className="flex min-w-0 items-center gap-2">
        {selectable ? <SelectBox label={labels.selectRow(primary ? columnText(primary, row) : id)} checked={isSelected} onToggle={() => table.toggleRow(id)} /> : null}
        <p className="min-w-0 text-sm font-medium break-words">{primary ? cellOf(primary, row) : id}</p>
      </div>
      {rest.length > 0 ? (
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-[13px]">
          {rest.map((column) => (
            <div key={column.key} className="col-span-2 grid grid-cols-subgrid">
              <dt className="text-muted-foreground">{column.header}</dt>
              <dd className={cn("min-w-0 text-right break-words", column.numeric && "tabular-nums")}>{cellOf(column, row)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </li>
  )
}

function DataTableCards<Row>({ table, labels, selectable, loading, loadingRows, emptyText, className }: ViewProps<Row> & { className?: string }) {
  if (loading) {
    return (
      <div aria-hidden="true" className={cn("grid grid-cols-[minmax(0,1fr)] gap-2", className)}>
        {Array.from({ length: loadingRows }, (_, index) => (
          <Skeleton key={index} data-testid="data-table-card-skeleton" className="h-24 rounded-lg" />
        ))}
      </div>
    )
  }
  if (table.pageRows.length === 0) {
    return (
      <div className={cn("grid min-h-32 place-items-center rounded-lg border p-4 text-center text-sm text-muted-foreground", className)}>
        <EmptyMessage table={table} labels={labels} emptyText={emptyText} />
      </div>
    )
  }
  return (
    <div className={cn("grid grid-cols-[minmax(0,1fr)] gap-2", className)}>
      {selectable ? (
        <div className="flex items-center gap-2 px-3 text-[13px] text-muted-foreground">
          <SelectBox label={labels.selectPage} checked={table.pageChecked} onToggle={table.togglePage} />
          <span aria-hidden="true">{labels.selectPage}</span>
        </div>
      ) : null}
      <ul data-slot="data-table-cards" className="grid grid-cols-[minmax(0,1fr)] gap-2">
        {table.pageRows.map((row) => (
          <DataTableCard key={table.getRowId(row)} row={row} table={table} labels={labels} selectable={selectable} />
        ))}
      </ul>
    </div>
  )
}

export { DataTableCards, DataTableTable }
