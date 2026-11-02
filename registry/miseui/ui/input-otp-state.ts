import type * as React from "react"
import { useRef, useState } from "react"

type InputOTPMode = "numeric" | "alphanumeric"
type Selection = readonly [number, number]

const STRIP: Record<InputOTPMode, RegExp> = { numeric: /\D/g, alphanumeric: /[^a-zA-Z0-9]/g }

function sanitize(raw: string, mode: InputOTPMode) {
  const kept = raw.replace(STRIP[mode], "")
  return mode === "alphanumeric" ? kept.toUpperCase() : kept
}

/**
 * The boxes behave as overwrite slots: a caret resting before a digit selects that digit, so typing replaces it
 * and arrows move by whole boxes. Past the last box the caret falls back onto it, so a full code stays editable.
 */
function boxSelection(start: number, end: number, filled: number, length: number): Selection {
  if (start !== end) return [start, end]
  if (start >= length) return [length - 1, length]
  return start < filled ? [start, start + 1] : [start, start]
}

type KeyAction = { place: number } | { remove: Selection; caret: number } | null

/** Android keyboards often report "Unidentified" here; those edits fall through to native editing and onChange. */
function actionForKey(key: string, [start, end]: Selection, filled: number): KeyAction {
  if (key === "ArrowLeft") return { place: Math.max(0, start - 1) }
  if (key === "ArrowRight") return { place: Math.min(filled, start + 1) }
  if (key === "Home") return { place: 0 }
  if (key === "End") return { place: filled }
  if (key === "Delete") return { remove: [start, end], caret: start }
  if (key !== "Backspace") return null
  if (start === end) return start > 0 ? { remove: [start - 1, start], caret: start - 1 } : { place: 0 }
  // Off the last digit the caret stays on the emptied box; mid-code it steps left, or repeated presses would stall.
  const stay = end >= filled || end - start > 1
  return { remove: [start, end], caret: stay ? start : Math.max(0, start - 1) }
}

interface OtpStateOptions {
  length: number
  mode: InputOTPMode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  onComplete?: (value: string) => void
}

/** All edits go through the one real input, so autofill, undo, IME and screen readers see an ordinary text field. */
function useOtpState({ length, mode, value, defaultValue, onValueChange, onComplete }: OtpStateOptions) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uncontrolled, setUncontrolled] = useState(() => sanitize(defaultValue ?? "", mode).slice(0, length))
  const [storedSelection, setSelection] = useState<Selection>([0, 0])
  const [focused, setFocused] = useState(false)
  const current = value ?? uncontrolled
  // An owner clearing a wrong code fires no `select` event, so a selection past the end is stale and is re-derived.
  const selection =
    storedSelection[1] > current.length
      ? boxSelection(current.length, current.length, current.length, length)
      : storedSelection

  const place = (start: number, end: number, text: string) => {
    const next = boxSelection(start, end, text.length, length)
    inputRef.current?.setSelectionRange(next[0], next[1])
    // `select` fires often and usually changes nothing; keeping the old array skips those re-renders.
    setSelection((previous) => (previous[0] === next[0] && previous[1] === next[1] ? previous : next))
  }

  const commit = (next: string, caret: number) => {
    const text = next.slice(0, length)
    const at = Math.min(caret, text.length)
    // Writing to the DOM before React re-renders keeps the caret where it is put, not at the end of the field.
    if (inputRef.current) inputRef.current.value = text
    place(at, at, text)
    if (text === current) return
    setUncontrolled(text)
    onValueChange?.(text)
    if (text.length === length) onComplete?.(text)
  }

  return { inputRef, text: current, selection, focused, setFocused, place, commit, length, mode }
}

/** Separate from the state so each handler reads on its own. Named as a hook because it closes over a ref. */
function useOtpHandlers(otp: ReturnType<typeof useOtpState>) {
  const { text: current, selection, setFocused, place, commit, length, mode } = otp
  const placeAt = (index: number) => place(index, index, current)
  const remove = ([start, end]: Selection, caret: number) => commit(current.slice(0, start) + current.slice(end), caret)

  return {
    onFocus: () => {
      setFocused(true)
      // Tabbing in selects all by default; the caret belongs on the next empty box.
      placeAt(current.length)
    },
    onBlur: () => setFocused(false),
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value
      const caret = event.target.selectionStart ?? raw.length
      // Count what the filter removes before the caret, or a rejected character would push the caret forward.
      commit(sanitize(raw, mode), sanitize(raw.slice(0, caret), mode).length)
    },
    onPaste: (event: React.ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault()
      const pasted = sanitize(event.clipboardData.getData("text"), mode)
      if (!pasted) return
      // A code as long as the field is the whole answer, whatever box the caret happens to be on.
      if (pasted.length >= length) return commit(pasted, length)
      const [start, end] = selection
      commit(current.slice(0, start) + pasted + current.slice(end), start + pasted.length)
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const action = actionForKey(event.key, selection, current.length)
      if (!action) return
      event.preventDefault()
      if ("place" in action) placeAt(action.place)
      else remove(action.remove, action.caret)
    },
    onSelect: (event: React.SyntheticEvent<HTMLInputElement>) => {
      const { selectionStart, selectionEnd, value } = event.currentTarget
      place(selectionStart ?? 0, selectionEnd ?? 0, value)
    },
    onClick: (event: React.MouseEvent<HTMLInputElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      if (rect.width === 0) return
      const box = Math.floor(((event.clientX - rect.left) / rect.width) * length)
      placeAt(Math.min(Math.max(0, box), current.length))
    },
  }
}

export { useOtpHandlers, useOtpState, type InputOTPMode }
