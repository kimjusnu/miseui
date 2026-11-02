import type * as React from "react"
import { useId, useMemo, useRef, useState } from "react"

interface ListboxOption {
  value: string
  label: string
  description?: string
  /** Options sharing a group sit together under its name, in the order the groups first appear. */
  group?: string
  disabled?: boolean
  icon?: React.ReactNode
}

interface ListboxGroup {
  name: string | null
  options: readonly ListboxOption[]
}

const TYPEAHEAD_RESET_MS = 500

/** Display order, which is the order the keyboard has to follow even when the owner's array mixes its groups. */
function groupOptions(options: readonly ListboxOption[]): readonly ListboxGroup[] {
  const names = [...new Set(options.map((option) => option.group ?? null))]
  return names.map((name) => ({ name, options: options.filter((option) => (option.group ?? null) === name) }))
}

function firstEnabled(options: readonly ListboxOption[]) {
  return options.find((option) => !option.disabled) ?? null
}

/** Walks from `from` in steps of `delta` and stops at the ends; a listbox does not wrap. */
function nextEnabled(options: readonly ListboxOption[], from: number, delta: 1 | -1) {
  for (let index = from + delta; index >= 0 && index < options.length; index += delta) {
    if (!options[index].disabled) return options[index]
  }
  return null
}

/** Starts after the current option, so pressing one letter again walks through everything that starts with it. */
function typeaheadMatch(options: readonly ListboxOption[], query: string, from: number) {
  const repeated = [...query].every((character) => character === query[0])
  const needle = (repeated ? query[0] : query).toLowerCase()
  const start = repeated ? from + 1 : from
  const rotated = [...options.slice(Math.max(start, 0)), ...options.slice(0, Math.max(start, 0))]
  return rotated.find((option) => !option.disabled && option.label.toLowerCase().startsWith(needle)) ?? null
}

function keepInView(list: HTMLElement, option: HTMLElement | null) {
  if (!option) return
  // Not scrollIntoView, which would also scroll the page around the list.
  const listBox = list.getBoundingClientRect()
  const box = option.getBoundingClientRect()
  if (box.top < listBox.top) list.scrollTop -= listBox.top - box.top
  else if (box.bottom > listBox.bottom) list.scrollTop += box.bottom - listBox.bottom
}

interface ListboxStateOptions {
  options: readonly ListboxOption[]
  multiple: boolean
  disabled: boolean
  controlled?: readonly string[]
  initial: readonly string[]
  emit: (next: readonly string[]) => void
}

function useListboxSelection({ controlled, initial, multiple, emit }: Pick<ListboxStateOptions, "controlled" | "initial" | "multiple" | "emit">) {
  const [uncontrolled, setUncontrolled] = useState(initial)
  const selected = controlled ?? uncontrolled
  const replace = (next: readonly string[]) => {
    setUncontrolled(next)
    emit(next)
  }
  const toggle = (value: string) => {
    if (!multiple) {
      replace([value])
      return
    }
    replace(selected.includes(value) ? selected.filter((entry) => entry !== value) : [...selected, value])
  }
  return { selected, replace, toggle }
}

function useListboxTypeahead(jump: (query: string) => void) {
  const buffer = useRef("")
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  return {
    busy: () => buffer.current.length > 0,
    press: (character: string) => {
      clearTimeout(timer.current)
      buffer.current += character
      jump(buffer.current)
      timer.current = setTimeout(() => {
        buffer.current = ""
      }, TYPEAHEAD_RESET_MS)
    },
  }
}

interface ListboxKeyActions {
  multiple: boolean
  ordered: readonly ListboxOption[]
  enabled: readonly ListboxOption[]
  active: ListboxOption | null
  stepped: (delta: 1 | -1, extend: boolean) => void
  moveTo: (option: ListboxOption | null) => void
  pick: (option: ListboxOption) => void
  selectAll: () => void
  typeahead: ReturnType<typeof useListboxTypeahead>
}

function listboxKeyDown(event: React.KeyboardEvent, keys: ListboxKeyActions) {
  const { multiple, ordered, enabled, active, stepped, moveTo, pick, selectAll, typeahead } = keys
  const ctrl = event.ctrlKey || event.metaKey
  const actions: Record<string, () => void> = {
    ArrowDown: () => stepped(1, event.shiftKey),
    ArrowUp: () => stepped(-1, event.shiftKey),
    Home: () => moveTo(firstEnabled(ordered)),
    End: () => moveTo(enabled[enabled.length - 1] ?? null),
    Enter: () => {
      if (active) pick(active)
    },
  }
  if (ctrl && event.key.toLowerCase() === "a" && multiple) {
    event.preventDefault()
    selectAll()
  } else if (actions[event.key]) {
    event.preventDefault()
    actions[event.key]()
  } else if (event.key === " " && !typeahead.busy()) {
    event.preventDefault()
    if (active) pick(active)
  } else if (event.key.length === 1 && !ctrl && !event.altKey) {
    event.preventDefault()
    typeahead.press(event.key)
  }
}

function useListboxState(props: ListboxStateOptions, listRef: React.RefObject<HTMLDivElement | null>) {
  const { options, multiple, disabled } = props
  const listId = useId()
  const groups = useMemo(() => groupOptions(options), [options])
  const ordered = useMemo(() => groups.flatMap((group) => group.options), [groups])
  const { selected, replace, toggle } = useListboxSelection(props)
  const [activeValue, setActiveValue] = useState<string | null>(null)
  const enabled = ordered.filter((option) => !option.disabled)
  const stillThere = ordered.find((option) => option.value === activeValue && !option.disabled)
  const active = stillThere ?? ordered.find((option) => selected.includes(option.value) && !option.disabled) ?? firstEnabled(ordered)
  const activeIndex = active ? ordered.indexOf(active) : -1
  const optionDomId = (value: string) => `${listId}-${ordered.findIndex((option) => option.value === value)}`
  const moveTo = (option: ListboxOption | null) => {
    if (!option) return
    setActiveValue(option.value)
    if (listRef.current) keepInView(listRef.current, document.getElementById(optionDomId(option.value)))
  }
  const typeahead = useListboxTypeahead((query) => moveTo(typeaheadMatch(ordered, query, activeIndex)))
  const pick = (option: ListboxOption) => {
    if (option.disabled || disabled) return
    setActiveValue(option.value)
    toggle(option.value)
  }
  const stepped = (delta: 1 | -1, extend: boolean) => {
    const next = nextEnabled(ordered, activeIndex, delta)
    moveTo(next)
    if (next && extend && multiple) toggle(next.value)
  }
  const selectAll = () => {
    const values = enabled.map((option) => option.value)
    replace(values.every((value) => selected.includes(value)) ? [] : values)
  }
  const onKeyDown = (event: React.KeyboardEvent) =>
    listboxKeyDown(event, { multiple, ordered, enabled, active, stepped, moveTo, pick, selectAll, typeahead })
  return { groups, ordered, selected, active, optionDomId, pick, onKeyDown }
}

type ListboxState = ReturnType<typeof useListboxState>

export {
  firstEnabled,
  groupOptions,
  nextEnabled,
  typeaheadMatch,
  useListboxState,
  type ListboxGroup,
  type ListboxOption,
  type ListboxState,
}
