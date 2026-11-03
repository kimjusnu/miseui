import type * as React from "react"
import { useEffect, useLayoutEffect, useRef } from "react"

function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

interface EscapeContext {
  key: string
  defaultPrevented: boolean
  target: EventTarget | null
  bar: Element | null
  /** Escape counts only while focus is inside this element. Null means the whole page. */
  scope: Element | null
  activeElement: Element | null
}

/**
 * An open dialog or menu marks its own Escape as handled, so that layer closes first and the selection survives.
 * A field outside the bar keeps Escape as well: there it means "stop typing", and losing a long selection to it would hurt.
 */
function shouldClearOnEscape({ key, defaultPrevented, target, bar, scope, activeElement }: EscapeContext) {
  if (key !== "Escape" || defaultPrevented) return false
  if (scope && !scope.contains(activeElement)) return false
  const insideBar = target instanceof Node && Boolean(bar?.contains(target))
  return insideBar || !isEditable(target)
}

interface EscapeOptions {
  open: boolean
  onClear: () => void
  barRef: React.RefObject<HTMLElement | null>
  scopeRef?: React.RefObject<HTMLElement | null>
}

function useEscapeToClear({ open, onClear, barRef, scopeRef }: EscapeOptions) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      const clear = shouldClearOnEscape({
        key: event.key,
        defaultPrevented: event.defaultPrevented,
        target: event.target,
        bar: barRef.current,
        scope: scopeRef?.current ?? null,
        activeElement: document.activeElement,
      })
      if (clear) onClear()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onClear, barRef, scopeRef])
}

/**
 * Selecting must not pull focus into the bar, so it never takes focus on arrival. When the bar leaves with focus
 * inside, focus goes back to where it came from, because otherwise the keyboard user lands at the top of the page.
 */
function useFocusReturn(open: boolean, barRef: React.RefObject<HTMLElement | null>, returnFocusRef?: React.RefObject<HTMLElement | null>) {
  const cameFromRef = useRef<HTMLElement | null>(null)
  // A layout effect, and the bar is still in the DOM: AnimatePresence keeps it for this commit even without an exit.
  useLayoutEffect(() => {
    if (open || !barRef.current?.contains(document.activeElement)) return
    const target = returnFocusRef?.current ?? cameFromRef.current
    if (target?.isConnected) target.focus()
  }, [open, barRef, returnFocusRef])
  return (event: React.FocusEvent<HTMLElement>) => {
    const from = event.relatedTarget
    if (from instanceof HTMLElement && !event.currentTarget.contains(from)) cameFromRef.current = from
  }
}

export { shouldClearOnEscape, useEscapeToClear, useFocusReturn }
