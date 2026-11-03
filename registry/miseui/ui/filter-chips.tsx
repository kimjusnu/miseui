import type * as React from "react"
import { useId, useMemo, useRef, useState } from "react"
import { LayoutGroup, useReducedMotion } from "motion/react"
import { Chip, type FilterChipsVariant } from "@/registry/miseui/ui/filter-chips-chip"
import { countOptions, filterItems, toggleValue, type FilterMatch } from "@/registry/miseui/ui/filter-chips-math"
import { cn } from "@/registry/miseui/lib/utils"

type FilterChipsEffect = "spring"

interface FilterChipsOption {
  value: string
  label: React.ReactNode
}

const ROW_CLASS: Record<FilterChipsVariant, string> = {
  pills: "flex flex-wrap gap-2",
  // Inset, not a border: a border on a scroller is clipped along with the marker that sits on it.
  underline: "flex overflow-x-auto [scrollbar-width:none] shadow-[inset_0_-1px_0_var(--border)] [&::-webkit-scrollbar]:hidden",
  list: "grid",
}

const CLEAR_CLASS =
  "h-8 shrink-0 rounded-md px-2 text-[13px] text-muted-foreground underline-offset-4 outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:h-10"

type FilterChipsProps = Omit<React.ComponentProps<"div">, "children" | "defaultValue" | "onChange"> & {
  options: readonly FilterChipsOption[]
  /** The pressed values. Empty means everything is showing. */
  value?: readonly string[]
  defaultValue?: readonly string[]
  onValueChange?: (value: readonly string[]) => void
  /** Lets several chips be pressed, and adds a clear button once one is. */
  multiple?: boolean
  /** Results per value. A chip with zero results is disabled unless it is pressed, since pressing it leads nowhere. */
  counts?: Readonly<Record<string, number>>
  /** Size of the unfiltered list, shown on the all chip. */
  total?: number
  /** How many results are showing now. Shown and announced politely as it changes. */
  results?: number
  resultsLabel?: (count: number) => string
  /** `pills` a wrapping row, `underline` one scrolling line of text, `list` a sidebar column with the counts aligned. */
  variant?: FilterChipsVariant
  /** `spring` slides one marker between chips. Only with single selection. */
  effect?: FilterChipsEffect
  /** Name of the group, for assistive tech. */
  label?: string
  allLabel?: React.ReactNode
  clearLabel?: string
}

const defaultResultsLabel = (count: number) => (count === 1 ? "1 result" : `${count} results`)

function useSelection(value: readonly string[] | undefined, defaultValue: readonly string[], onValueChange?: (next: readonly string[]) => void) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const selected = value ?? uncontrolled
  const select = (next: readonly string[]) => {
    setUncontrolled(next)
    onValueChange?.(next)
  }
  return [selected, select] as const
}

function ResultsLine({ results, resultsLabel }: Pick<FilterChipsProps, "results" | "resultsLabel">) {
  return (
    <p role="status" data-slot="filter-chips-results" className="text-[13px] leading-5 text-muted-foreground tabular-nums">
      {results === undefined ? null : (resultsLabel ?? defaultResultsLabel)(results)}
    </p>
  )
}

function FilterChips({
  options,
  value,
  defaultValue = [],
  onValueChange,
  multiple = false,
  counts,
  total,
  results,
  resultsLabel,
  variant = "pills",
  effect,
  label = "Filter",
  allLabel = "All",
  clearLabel = "Clear",
  className,
  ...props
}: FilterChipsProps) {
  const groupId = useId()
  const reduceMotion = useReducedMotion() ?? false
  const allRef = useRef<HTMLButtonElement>(null)
  const [selected, select] = useSelection(value, defaultValue, onValueChange)
  const shared = { variant, travelling: effect === "spring" && !multiple && !reduceMotion, showCheck: multiple }
  const canClear = multiple && selected.length > 0
  const clear = () => {
    select([])
    // The clear button is about to disappear, which would drop keyboard focus onto the page.
    allRef.current?.focus()
  }
  return (
    <div data-slot="filter-chips" data-variant={variant} data-effect={effect} className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2", className)} {...props}>
      <LayoutGroup id={groupId}>
        <div role="group" aria-label={label} data-slot="filter-chips-row" className={ROW_CLASS[variant]}>
          <Chip {...shared} buttonRef={allRef} label={allLabel} count={total} pressed={selected.length === 0} disabled={false} showCheck={false} onClick={() => select([])} />
          {options.map((option) => {
            const pressed = selected.includes(option.value)
            const count = counts ? (counts[option.value] ?? 0) : undefined
            return <Chip key={option.value} {...shared} label={option.label} count={count} pressed={pressed} disabled={count === 0 && !pressed} onClick={() => select(toggleValue(selected, option.value, multiple))} />
          })}
        </div>
      </LayoutGroup>
      {results !== undefined || canClear ? (
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-4">
          <ResultsLine results={results} resultsLabel={resultsLabel} />
          {canClear ? (
            <button type="button" data-slot="filter-chips-clear" className={CLEAR_CLASS} onClick={clear}>
              {clearLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

interface UseFilterChipsOptions<T> {
  items: readonly T[]
  /** The values an item can be filtered by. */
  getValues: (item: T) => readonly string[]
  multiple?: boolean
  /** With several chips pressed, `any` shows items with one of them and `all` only items with every one. */
  match?: FilterMatch
  defaultValue?: readonly string[]
}

/** The filtering itself: spread `chips` on the component and render `visible`. */
function useFilterChips<T>({ items, getValues, multiple = false, match = "any", defaultValue = [] }: UseFilterChipsOptions<T>) {
  const [selected, setSelected] = useState(defaultValue)
  const visible = useMemo(() => filterItems(items, getValues, selected, match), [items, getValues, selected, match])
  const counts = useMemo(() => countOptions(items, getValues, selected, match), [items, getValues, selected, match])
  return {
    visible,
    selected,
    chips: { value: selected, onValueChange: setSelected, multiple, counts, total: items.length, results: visible.length },
  }
}

export { FilterChips, countOptions, filterItems, toggleValue, useFilterChips, type FilterChipsEffect, type FilterChipsOption, type FilterChipsProps, type FilterChipsVariant, type FilterMatch }
