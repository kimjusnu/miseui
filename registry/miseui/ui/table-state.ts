import { useMemo, useState } from "react"

type SortDirection = "ascending" | "descending"

interface TableSort<Key extends string> {
  key: Key
  direction: SortDirection
}

type SortAccessor<Row> = (row: Row) => string | number | Date | null | undefined

/** Empty cells sink to the bottom in both directions: nobody sorts to look at blanks. */
function compareValues(a: unknown, b: unknown, collator: Intl.Collator) {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime()
  if (typeof a === "number" && typeof b === "number") return a - b
  return collator.compare(String(a), String(b))
}

/** Numeric collation so "Item 10" follows "Item 9". A new array, and equal rows keep their order. */
function sortRows<Row>(rows: readonly Row[], accessor: SortAccessor<Row>, direction: SortDirection, locale?: string) {
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" })
  const sign = direction === "ascending" ? 1 : -1
  const isEmpty = (value: unknown) => value === null || value === undefined || value === ""
  return [...rows].sort((rowA, rowB) => {
    const [a, b] = [accessor(rowA), accessor(rowB)]
    if (isEmpty(a) || isEmpty(b)) return Number(isEmpty(a)) - Number(isEmpty(b))
    return sign * compareValues(a, b, collator)
  })
}

/** Ascending, then descending, then back to the data's own order. */
function nextSort<Key extends string>(current: TableSort<Key> | null, key: Key): TableSort<Key> | null {
  if (current?.key !== key) return { key, direction: "ascending" }
  return current.direction === "ascending" ? { key, direction: "descending" } : null
}

function useTableSort<Row, Key extends string>(
  rows: readonly Row[],
  accessors: Record<Key, SortAccessor<Row>>,
  options: { initial?: TableSort<Key> | null; locale?: string } = {},
) {
  const { initial = null, locale } = options
  const [sort, setSort] = useState<TableSort<Key> | null>(initial)
  const sorted = useMemo(
    () => (sort ? sortRows(rows, accessors[sort.key], sort.direction, locale) : rows),
    [rows, accessors, sort, locale],
  )
  const headProps = (key: Key) => ({
    direction: sort?.key === key ? sort.direction : ("none" as const),
    onSort: () => setSort((current) => nextSort(current, key)),
  })
  return { sorted, sort, setSort, headProps }
}

interface TableSelectionOptions<Id> {
  /** Every selectable row on the screen, in display order. */
  ids: readonly Id[]
  defaultSelected?: readonly Id[]
}

/** Row selection state. Hand `checked` to a Checkbox: it is "indeterminate" when only some rows are chosen. */
function useTableSelection<Id>({ ids, defaultSelected = [] }: TableSelectionOptions<Id>) {
  const [selected, setSelected] = useState<ReadonlySet<Id>>(() => new Set(defaultSelected))
  const onScreen = ids.filter((id) => selected.has(id))
  const toggle = (id: Id) =>
    setSelected((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })
  const allOn = ids.length > 0 && onScreen.length === ids.length
  const toggleAll = () =>
    setSelected((current) => {
      const next = new Set(current)
      ids.forEach((id) => (allOn ? next.delete(id) : next.add(id)))
      return next
    })
  return {
    selected,
    count: onScreen.length,
    isSelected: (id: Id) => selected.has(id),
    toggle,
    toggleAll,
    clear: () => setSelected(new Set()),
    checked: allOn ? true : onScreen.length > 0 ? ("indeterminate" as const) : false,
  }
}

export { nextSort, sortRows, useTableSelection, useTableSort, type SortAccessor, type SortDirection, type TableSort }
