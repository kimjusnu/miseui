import type * as React from "react"
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { buildSections, type CommandItem } from "@/registry/miseui/ui/command-score"

interface UseCommandOptions {
  items: readonly CommandItem[]
  recent: readonly string[]
  recentLabel: string
  /** Escape clears the query where no dialog is there to close. */
  clearOnEscape: boolean
  /** While nothing is typed, offer recent items alone. */
  recentOnly: boolean
  onSelect?: (value: string, item: CommandItem) => void
  /** Runs after a selection, so a dialog can close. */
  onDone?: () => void
}

function optionId(listId: string, index: number) {
  return `${listId}-option-${index}`
}

interface ListKeyActions {
  move: (delta: number) => void
  run: () => void
  /** Only there when Escape has a query to clear and no dialog to close. */
  clear?: () => void
}

function listKeys({ move, run, clear }: ListKeyActions) {
  return (event: React.KeyboardEvent<HTMLInputElement>) => {
    // During IME composition these keys belong to the syllable being typed, not to the list.
    if (event.nativeEvent.isComposing) return
    const { key, ctrlKey } = event
    const handled = key === "ArrowDown" || key === "ArrowUp" || key === "Enter" || (ctrlKey && (key === "n" || key === "p"))
    if (handled) event.preventDefault()
    if (key === "ArrowDown" || (ctrlKey && key === "n")) move(1)
    else if (key === "ArrowUp" || (ctrlKey && key === "p")) move(-1)
    else if (key === "Enter") run()
    else if (key === "Escape" && clear) {
      event.stopPropagation()
      clear()
    }
  }
}

function useCommand({ items, recent, recentLabel, clearOnEscape, recentOnly, onSelect, onDone }: UseCommandOptions) {
  const [query, setQueryState] = useState("")
  const [activeValue, setActiveValue] = useState<string | null>(null)
  const listId = useId()
  const sections = useMemo(() => buildSections(items, query, recent, recentLabel, recentOnly), [items, query, recent, recentLabel, recentOnly])
  const visible = useMemo(() => sections.flatMap((section) => section.entries.map((entry) => entry.item)), [sections])
  const enabled = useMemo(() => visible.filter((item) => !item.disabled), [visible])
  const active = enabled.find((item) => item.value === activeValue) ?? enabled[0]
  const activeIndex = active ? visible.indexOf(active) : -1
  const activeOptionId = activeIndex >= 0 ? optionId(listId, activeIndex) : undefined

  useEffect(() => {
    if (activeOptionId) document.getElementById(activeOptionId)?.scrollIntoView({ block: "nearest" })
  }, [activeOptionId])

  const setQuery = (next: string) => {
    setQueryState(next)
    setActiveValue(null)
  }

  const select = (item: CommandItem) => {
    if (item.disabled) return
    item.onSelect?.()
    onSelect?.(item.value, item)
    onDone?.()
  }

  const move = (delta: number) => {
    if (enabled.length === 0) return
    const at = active ? enabled.indexOf(active) : -1
    setActiveValue(enabled[(at + delta + enabled.length) % enabled.length].value)
  }

  const onKeyDown = listKeys({
    move,
    run: () => {
      if (active) select(active)
    },
    clear: clearOnEscape && query ? () => setQuery("") : undefined,
  })

  return { query, setQuery, listId, sections, visible, active, activeOptionId, setActiveValue, select, onKeyDown }
}

interface ShortcutOptions {
  /** The letter pressed with Cmd or Ctrl. */
  key?: string
  enabled?: boolean
}

/** Mod+K for the palette. The handler may change every render without re-subscribing. */
function useCommandShortcut(handler: () => void, { key = "k", enabled = true }: ShortcutOptions = {}) {
  const latest = useRef(handler)
  useEffect(() => {
    latest.current = handler
  })
  useEffect(() => {
    if (!enabled) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.isComposing) return
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === key.toLowerCase()) {
        // Browsers use Ctrl+K for the address bar; the page asked for it, so it wins.
        event.preventDefault()
        latest.current()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [key, enabled])
}

/** The content's height in px, tracked through every change, so a parent can spring to it instead of snapping. */
function useMeasuredHeight() {
  const [height, setHeight] = useState<number | undefined>(undefined)
  const observer = useRef<ResizeObserver | null>(null)
  const ref = useCallback((node: HTMLElement | null) => {
    observer.current?.disconnect()
    observer.current = null
    if (!node || typeof ResizeObserver === "undefined") return
    observer.current = new ResizeObserver(() => setHeight(node.offsetHeight))
    observer.current.observe(node)
  }, [])
  return { height, ref }
}

export { optionId, useCommand, useCommandShortcut, useMeasuredHeight }
