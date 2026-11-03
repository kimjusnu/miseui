import { useMemo, useState } from "react"
import {
  columnValue,
  filterRows,
  pageChecked,
  pageCountOf,
  pageRange,
  pageSlice,
  toggleColumn,
  toggleId,
  togglePage,
  type DataTableColumn,
} from "@/registry/miseui/ui/data-table-math"
import { nextSort, sortRows, type TableSort } from "@/registry/miseui/ui/table-state"

function useControllable<Value>(controlled: Value | undefined, initial: Value, onChange?: (value: Value) => void) {
  const [uncontrolled, setUncontrolled] = useState(initial)
  const value = controlled !== undefined ? controlled : uncontrolled
  const setValue = (next: Value) => {
    setUncontrolled(next)
    onChange?.(next)
  }
  return [value, setValue] as const
}

interface DataTableStateOptions<Row> {
  rows: readonly Row[]
  columns: readonly DataTableColumn<Row>[]
  getRowId: (row: Row) => string
  pageSize: number
  defaultSort?: TableSort<string> | null
  locale?: string
  query?: string
  defaultQuery?: string
  onQueryChange?: (query: string) => void
  selected?: readonly string[]
  defaultSelected?: readonly string[]
  onSelectedChange?: (selected: readonly string[]) => void
  hiddenColumns?: readonly string[]
  defaultHiddenColumns?: readonly string[]
  onHiddenColumnsChange?: (hidden: readonly string[]) => void
}

const EMPTY: readonly string[] = []

function columnActions<Row>(columns: readonly DataTableColumn<Row>[], hidden: readonly string[], setHidden: (next: readonly string[]) => void) {
  const allKeys = columns.map((column) => column.key)
  return {
    visibleColumns: columns.filter((column) => !hidden.includes(column.key)),
    columns,
    hidden,
    isOnlyVisible: (key: string) => allKeys.filter((entry) => !hidden.includes(entry)).length === 1 && !hidden.includes(key),
    toggleColumn: (key: string) => setHidden(toggleColumn(hidden, key, allKeys)),
  }
}

function selectionActions<Row>(selected: readonly string[], setSelected: (next: readonly string[]) => void, pageIds: readonly string[], selectedRows: readonly Row[]) {
  return {
    selected,
    selectedRows,
    pageChecked: pageChecked(selected, pageIds),
    toggleRow: (id: string) => setSelected(toggleId(selected, id)),
    togglePage: () => setSelected(togglePage(selected, pageIds)),
    clearSelection: () => setSelected(EMPTY),
  }
}

function useDataTable<Row>(options: DataTableStateOptions<Row>) {
  const { rows, columns, getRowId, pageSize, locale } = options
  const [query, setQueryValue] = useControllable(options.query, options.defaultQuery ?? "", options.onQueryChange)
  const [selected, setSelected] = useControllable(options.selected, options.defaultSelected ?? EMPTY, options.onSelectedChange)
  const [hidden, setHidden] = useControllable(options.hiddenColumns, options.defaultHiddenColumns ?? EMPTY, options.onHiddenColumnsChange)
  const [sort, setSortValue] = useState<TableSort<string> | null>(options.defaultSort ?? null)
  const [rawPage, setPage] = useState(1)

  const filtered = useMemo(() => filterRows(rows, columns, query), [rows, columns, query])
  const sorted = useMemo(() => {
    const column = sort ? columns.find((entry) => entry.key === sort.key) : undefined
    if (!sort || !column) return filtered
    return sortRows(filtered, (row) => columnValue(column, row), sort.direction, locale)
  }, [filtered, columns, sort, locale])

  const pageCount = pageCountOf(sorted.length, pageSize)
  const page = Math.min(rawPage, pageCount)
  const pageRows = pageSlice(sorted, page, pageSize)
  const pageIds = pageRows.map(getRowId)

  return {
    query,
    // A narrower list may have fewer pages, and page 3 of something new means nothing.
    setQuery: (next: string) => {
      setQueryValue(next)
      setPage(1)
    },
    sort,
    setSort: (next: TableSort<string> | null) => {
      setSortValue(next)
      setPage(1)
    },
    cycleSort: (key: string) => {
      setSortValue((current) => nextSort(current, key))
      setPage(1)
    },
    page,
    setPage,
    pageCount,
    pageSize,
    pageRows,
    range: pageRange(page, pageSize, sorted.length),
    total: sorted.length,
    getRowId,
    ...columnActions(columns, hidden, setHidden),
    ...selectionActions(selected, setSelected, pageIds, rows.filter((row) => selected.includes(getRowId(row)))),
  }
}

type DataTableState<Row> = ReturnType<typeof useDataTable<Row>>

export { useDataTable, type DataTableState, type DataTableStateOptions }
