type FilterMatch = "any" | "all"

function matchesFilter(values: readonly string[], selected: readonly string[], match: FilterMatch) {
  if (selected.length === 0) return true
  return match === "any" ? selected.some((value) => values.includes(value)) : selected.every((value) => values.includes(value))
}

function filterItems<T>(items: readonly T[], getValues: (item: T) => readonly string[], selected: readonly string[], match: FilterMatch = "any") {
  return items.filter((item) => matchesFilter(getValues(item), selected, match))
}

/**
 * How many results each chip stands for. With `any`, chips add to each other, so the count is simply how many items
 * carry that value. With `all`, each chip narrows further, so it is how many would be left after pressing it, and a
 * zero warns of a dead end before anyone walks into it.
 */
function countOptions<T>(items: readonly T[], getValues: (item: T) => readonly string[], selected: readonly string[], match: FilterMatch = "any") {
  const pool = match === "all" ? filterItems(items, getValues, selected, "all") : items
  const counted = pool.flatMap((item) => [...new Set(getValues(item))])
  return counted.reduce<Readonly<Record<string, number>>>((counts, value) => ({ ...counts, [value]: (counts[value] ?? 0) + 1 }), {})
}

function toggleValue(selected: readonly string[], value: string, multiple: boolean): readonly string[] {
  const pressed = selected.includes(value)
  if (!multiple) return pressed ? [] : [value]
  return pressed ? selected.filter((entry) => entry !== value) : [...selected, value]
}

export { countOptions, filterItems, matchesFilter, toggleValue, type FilterMatch }
