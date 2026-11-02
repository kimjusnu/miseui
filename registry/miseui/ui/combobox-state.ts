import type * as React from "react"
import { useId, useMemo, useState } from "react"

interface ComboboxOption {
  value: string
  label: string
  /** A second line, drawn by `avatar` and always searched. */
  description?: string
  /** Leading picture or icon, drawn by `avatar`. */
  media?: React.ReactNode
  /** Section name, drawn by `grouped`. */
  group?: string
  disabled?: boolean
}

interface ComboboxGroup {
  name: string | null
  options: readonly ComboboxOption[]
}

function filterOptions(options: readonly ComboboxOption[], query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return options
  return options.filter((option) => `${option.label} ${option.description ?? ""}`.toLowerCase().includes(needle))
}

/** Sections in first-seen order, so the eye and the arrow keys travel the list the same way. */
function groupOptions(options: readonly ComboboxOption[], grouped: boolean): readonly ComboboxGroup[] {
  if (!grouped) return [{ name: null, options }]
  const names = [...new Set(options.map((option) => option.group ?? ""))]
  return names.map((name) => ({
    name: name || null,
    options: options.filter((option) => (option.group ?? "") === name),
  }))
}

interface ComboboxStateOptions {
  options: readonly ComboboxOption[]
  /** Normalised to an array so single and multiple share one code path. */
  controlled: readonly string[] | undefined
  initial: readonly string[]
  multiple: boolean
  grouped: boolean
  /** Backspace in an empty search removes the last chip; only meaningful where chips are visible. */
  removeOnBackspace: boolean
  serverFiltered: boolean
  emit: (next: readonly string[]) => void
  onSearch?: (query: string) => void
}

function useSelection({ options, controlled, initial, multiple, emit }: ComboboxStateOptions) {
  const [uncontrolled, setUncontrolled] = useState<readonly string[]>(initial)
  // Async results replace `options`, so a chosen option has to be remembered to keep its label in the trigger.
  const [remembered, setRemembered] = useState<Readonly<Record<string, ComboboxOption>>>({})
  const selected = controlled ?? uncontrolled

  const update = (next: readonly string[]) => {
    setUncontrolled(next)
    emit(next)
  }
  const known = (value: string) =>
    options.find((option) => option.value === value) ?? remembered[value] ?? { value, label: value }

  return {
    selected,
    selectedOptions: selected.map(known),
    remove: (value: string) => update(selected.filter((entry) => entry !== value)),
    removeLast: () => update(selected.slice(0, -1)),
    toggle: (option: ComboboxOption) => {
      setRemembered((previous) => ({ ...previous, [option.value]: option }))
      const isSelected = selected.includes(option.value)
      if (multiple) {
        update(isSelected ? selected.filter((value) => value !== option.value) : [...selected, option.value])
      } else {
        update(isSelected ? [] : [option.value])
      }
    },
  }
}

function useVisibleOptions({ options, grouped, serverFiltered }: ComboboxStateOptions, query: string, activeValue: string | null) {
  const groups = useMemo(
    () => groupOptions(serverFiltered ? options : filterOptions(options, query), grouped),
    [options, query, grouped, serverFiltered],
  )
  const visible = useMemo(() => groups.flatMap((group) => group.options), [groups])
  const enabled = useMemo(() => visible.filter((option) => !option.disabled), [visible])
  // Derived, not stored: when results change under the highlight it falls to the first row instead of pointing at nothing.
  const active = enabled.find((option) => option.value === activeValue) ?? enabled[0] ?? null
  const neighbour = (step: 1 | -1) => {
    if (enabled.length === 0) return null
    const index = active ? enabled.indexOf(active) : -1
    return enabled[(index + step + enabled.length) % enabled.length].value
  }
  return { groups, visible, active, neighbour }
}

function useComboboxState(config: ComboboxStateOptions) {
  const { multiple, removeOnBackspace, onSearch } = config
  const listId = useId()
  const [open, setOpenState] = useState(false)
  const [query, setQuery] = useState("")
  const [activeValue, setActiveValue] = useState<string | null>(null)
  const selection = useSelection(config)
  const list = useVisibleOptions(config, query, activeValue)

  const setOpen = (next: boolean) => {
    setOpenState(next)
    if (next) setActiveValue(selection.selected[0] ?? null)
    if (next) return
    if (query) onSearch?.("")
    setQuery("")
  }
  const toggle = (option: ComboboxOption) => {
    if (option.disabled) return
    selection.toggle(option)
    if (!multiple) setOpen(false)
  }
  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      setActiveValue(list.neighbour(event.key === "ArrowDown" ? 1 : -1))
    } else if (event.key === "Enter") {
      // Inside a form, Enter on a search box must pick a row, not submit.
      event.preventDefault()
      if (list.active) toggle(list.active)
    } else if (event.key === "Backspace" && !query && removeOnBackspace && selection.selected.length > 0) {
      selection.removeLast()
    }
  }
  const onQueryChange = (next: string) => {
    setQuery(next)
    onSearch?.(next)
  }
  return { ...selection, ...list, listId, open, setOpen, query, onQueryChange, setActiveValue, toggle, onInputKeyDown }
}

export { useComboboxState, type ComboboxGroup, type ComboboxOption }
