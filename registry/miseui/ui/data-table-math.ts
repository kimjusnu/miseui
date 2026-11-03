import type * as React from "react"
import type { SortAccessor, SortDirection, TableSort } from "@/registry/miseui/ui/table-state"

interface DataTableColumn<Row> {
  key: string
  header: string
  /** What sorting and filtering read. Without it, the field of the row named by `key`. */
  value?: SortAccessor<Row>
  /** What the cell shows. Without it, the value as text. */
  cell?: (row: Row) => React.ReactNode
  /** Defaults to true. */
  sortable?: boolean
  /** Defaults to true. Turn off for ids and figures nobody searches by. */
  filterable?: boolean
  /** Defaults to true. False keeps the column on the screen and out of the column menu's reach. */
  hideable?: boolean
  /** Right-aligned tabular figures. */
  numeric?: boolean
  className?: string
}

function columnValue<Row>(column: DataTableColumn<Row>, row: Row) {
  if (column.value) return column.value(row)
  return (row as Record<string, unknown>)[column.key] as ReturnType<SortAccessor<Row>>
}

function columnText<Row>(column: DataTableColumn<Row>, row: Row) {
  const value = columnValue(column, row)
  if (value === null || value === undefined) return ""
  return value instanceof Date ? value.toLocaleDateString() : String(value)
}

/** Every word has to appear somewhere in the row, so "north bakery" finds a row whose words sit in two columns. */
function filterRows<Row>(rows: readonly Row[], columns: readonly DataTableColumn<Row>[], query: string) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return rows
  const searchable = columns.filter((column) => column.filterable !== false)
  return rows.filter((row) => {
    const haystack = searchable.map((column) => columnText(column, row)).join(" ").toLocaleLowerCase()
    return terms.every((term) => haystack.includes(term))
  })
}

const pageCountOf = (total: number, pageSize: number) => Math.max(1, Math.ceil(total / Math.max(1, pageSize)))

function pageSlice<Row>(rows: readonly Row[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return rows.slice(start, start + pageSize)
}

function pageRange(page: number, pageSize: number, total: number) {
  if (total === 0) return { from: 0, to: 0 }
  return { from: (page - 1) * pageSize + 1, to: Math.min(total, page * pageSize) }
}

function toggleId(selected: readonly string[], id: string) {
  return selected.includes(id) ? selected.filter((entry) => entry !== id) : [...selected, id]
}

/** All on leaves the page empty; anything less fills it. Rows chosen on other pages are not touched. */
function togglePage(selected: readonly string[], ids: readonly string[]) {
  const allOn = ids.length > 0 && ids.every((id) => selected.includes(id))
  if (allOn) return selected.filter((id) => !ids.includes(id))
  return [...selected, ...ids.filter((id) => !selected.includes(id))]
}

function pageChecked(selected: readonly string[], ids: readonly string[]) {
  const on = ids.filter((id) => selected.includes(id)).length
  if (on === 0) return false
  return on === ids.length ? true : ("indeterminate" as const)
}

/** The last visible column stays: a table with no columns has no way back to the menu's meaning. */
function toggleColumn(hidden: readonly string[], key: string, allKeys: readonly string[]) {
  if (hidden.includes(key)) return hidden.filter((entry) => entry !== key)
  const visible = allKeys.filter((entry) => !hidden.includes(entry))
  return visible.length <= 1 ? hidden : [...hidden, key]
}

function sortToOption<Key extends string>(sort: TableSort<Key> | null) {
  return sort ? `${sort.key}:${sort.direction}` : ""
}

function sortFromOption(option: string): TableSort<string> | null {
  const [key, direction] = option.split(":")
  if (!key || (direction !== "ascending" && direction !== "descending")) return null
  return { key, direction: direction as SortDirection }
}

export {
  columnText,
  columnValue,
  filterRows,
  pageChecked,
  pageCountOf,
  pageRange,
  pageSlice,
  sortFromOption,
  sortToOption,
  toggleColumn,
  toggleId,
  togglePage,
  type DataTableColumn,
}
