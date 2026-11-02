import type * as React from "react"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { clampNumber, parseNumber, stepValue } from "@/registry/miseui/ui/number-input-math"

const HOLD_DELAY_MS = 400
const HOLD_REPEAT_MS = 70
const LARGE_STEP_FACTOR = 10

interface NumberInputStateOptions {
  value?: number | null
  defaultValue?: number | null
  onValueChange?: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  largeStep?: number
  locale?: string
  format?: Intl.NumberFormatOptions
  readOnly?: boolean
  disabled?: boolean
}

/** Starts stepping on press, keeps stepping while held, and stops at a bound because the button goes disabled. */
function useHoldRepeat(onStep: () => void, disabled: boolean) {
  const timer = useRef<number | undefined>(undefined)
  const latestStep = useRef(onStep)
  useLayoutEffect(() => {
    latestStep.current = onStep
  })
  const stop = useCallback(() => {
    // setTimeout and setInterval share one id pool, so clearTimeout ends whichever phase is running.
    window.clearTimeout(timer.current)
    timer.current = undefined
  }, [])
  useEffect(() => {
    if (disabled) stop()
  }, [disabled, stop])
  useEffect(() => stop, [stop])

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return
    stop()
    latestStep.current()
    timer.current = window.setTimeout(() => {
      timer.current = window.setInterval(() => latestStep.current(), HOLD_REPEAT_MS)
    }, HOLD_DELAY_MS)
  }
  return { onPointerDown, onPointerUp: stop, onPointerLeave: stop, onPointerCancel: stop }
}

/** The owner's value, plus what is being typed before it counts. */
function useNumberValue({ value, defaultValue = null, onValueChange, min, max, locale, format }: NumberInputStateOptions) {
  const bounds = useMemo(() => ({ min, max }), [min, max])
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const [draft, setDraft] = useState<string | null>(null)
  const current = value !== undefined ? value : uncontrolled
  // A held button steps faster than React re-renders a controlled owner, so each tick reads the newest value here.
  const latest = useRef(current)
  useLayoutEffect(() => {
    latest.current = current
  })
  const emit = (next: number | null) => {
    if (next === latest.current) return
    latest.current = next
    setUncontrolled(next)
    onValueChange?.(next)
  }
  /** Settles what was typed: blank clears, nonsense goes back to the last good number, the rest is clamped. */
  const commit = () => {
    if (draft === null) return latest.current
    setDraft(null)
    if (draft.trim() === "") {
      emit(null)
      return null
    }
    const parsed = parseNumber(draft, locale, format?.style === "percent")
    if (parsed === null) return latest.current
    const next = clampNumber(parsed, bounds)
    emit(next)
    return next
  }
  const stepFrom = (delta: number) => emit(stepValue(commit(), delta, bounds))
  return { current, draft, setDraft, emit, commit, stepFrom }
}

function useNumberInputState(options: NumberInputStateOptions) {
  const { min, max, step = 1, locale, format, readOnly, disabled } = options
  const largeStep = options.largeStep ?? step * LARGE_STEP_FACTOR
  const formatter = useMemo(() => new Intl.NumberFormat(locale, format), [locale, format])
  const { current, draft, setDraft, emit, commit, stepFrom } = useNumberValue(options)
  const stepBy = (delta: number) => {
    if (!readOnly && !disabled) stepFrom(delta)
  }
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const unit = event.shiftKey ? largeStep : step
    const moves: Record<string, (() => void) | undefined> = {
      ArrowUp: () => stepBy(unit),
      ArrowDown: () => stepBy(-unit),
      PageUp: () => stepBy(largeStep),
      PageDown: () => stepBy(-largeStep),
      // Without a bound these keys keep their normal job of moving the caret.
      Home: min === undefined ? undefined : () => emit(min),
      End: max === undefined ? undefined : () => emit(max),
      Enter: commit,
    }
    const move = moves[event.key]
    if (!move || readOnly || disabled) return
    // Enter must stay free to submit the surrounding form.
    if (event.key !== "Enter") event.preventDefault()
    move()
  }
  const formatted = current === null ? "" : formatter.format(current)
  return {
    current,
    draft,
    formatted,
    text: draft ?? formatted,
    atMin: current !== null && min !== undefined && current <= min,
    atMax: current !== null && max !== undefined && current >= max,
    increment: () => stepBy(step),
    decrement: () => stepBy(-step),
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setDraft(event.target.value),
    onBlur: commit,
    onKeyDown,
  }
}

type NumberInputState = ReturnType<typeof useNumberInputState>

export { useHoldRepeat, useNumberInputState, type NumberInputState, type NumberInputStateOptions }
