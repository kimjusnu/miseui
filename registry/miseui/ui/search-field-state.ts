import type * as React from "react"
import { useEffect, useRef, useState } from "react"

/** Long enough to skip the keys of a word typed in one go, short enough that results still feel like an answer. */
const DEFAULT_DEBOUNCE_MS = 250

/** Mod K: Command on Apple devices, Control everywhere else. */
function isFocusShortcut(event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey">) {
  return event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey
}

interface SearchFieldStateOptions {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  onSearch?: (query: string) => void
  debounceMs: number
  shortcut: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
}

function useShortcut(enabled: boolean, inputRef: React.RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    if (!enabled) return
    const onKey = (event: KeyboardEvent) => {
      if (!isFocusShortcut(event)) return
      // The browser would otherwise take this for its own address bar search.
      event.preventDefault()
      inputRef.current?.focus()
      inputRef.current?.select()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [enabled, inputRef])
}

/**
 * On the window in the capture phase: Radix dialogs and popovers listen on the document in capture, so a handler on
 * the input runs too late to keep the surrounding overlay from closing on the same press.
 */
function useEscapeClears(hasText: boolean, inputRef: React.RefObject<HTMLInputElement | null>, clear: () => void) {
  const latest = useRef(clear)
  useEffect(() => {
    latest.current = clear
  })
  useEffect(() => {
    if (!hasText) return
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.isComposing || event.target !== inputRef.current) return
      event.stopPropagation()
      event.preventDefault()
      latest.current()
    }
    window.addEventListener("keydown", onEscape, true)
    return () => window.removeEventListener("keydown", onEscape, true)
  }, [hasText, inputRef])
}

function useDebouncedSearch(onSearch: ((query: string) => void) | undefined, debounceMs: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const composing = useRef(false)
  const lastSent = useRef<string | null>(null)
  const search = useRef(onSearch)
  useEffect(() => {
    search.current = onSearch
  }, [onSearch])
  const cancel = () => {
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = null
  }
  useEffect(() => cancel, [])
  const send = (query: string) => {
    cancel()
    if (lastSent.current === query) return
    lastSent.current = query
    search.current?.(query)
  }
  const schedule = (query: string) => {
    cancel()
    // Half-typed syllables from an input method are not a query yet; compositionend schedules the finished text.
    if (composing.current) return
    timer.current = setTimeout(() => send(query), debounceMs)
  }
  const composition = {
    onCompositionStart: () => {
      composing.current = true
      cancel()
    },
    onCompositionEnd: (event: React.CompositionEvent<HTMLInputElement>) => {
      composing.current = false
      schedule(event.currentTarget.value)
    },
  }
  return { send, schedule, composition }
}

function useSearchFieldState({ value, defaultValue = "", onValueChange, onSearch, debounceMs, shortcut, inputRef }: SearchFieldStateOptions) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const current = value ?? uncontrolled
  const { send, schedule, composition } = useDebouncedSearch(onSearch, debounceMs)
  useShortcut(shortcut, inputRef)
  const change = (next: string) => {
    setUncontrolled(next)
    onValueChange?.(next)
    schedule(next)
  }
  const clear = () => {
    setUncontrolled("")
    onValueChange?.("")
    send("")
    inputRef.current?.focus()
  }
  useEscapeClears(current !== "", inputRef, clear)
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter belongs to the input method while it is composing.
    if (!event.nativeEvent.isComposing && event.key === "Enter") send(event.currentTarget.value)
  }
  return { current, change, clear, onKeyDown, composition }
}

export { DEFAULT_DEBOUNCE_MS, isFocusShortcut, useSearchFieldState }
