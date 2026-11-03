import type * as React from "react"
import { useMemo, useState } from "react"
import { applyEdit } from "@/registry/miseui/ui/mask-input-edit"
import {
  conform,
  formatMasked,
  isComplete,
  parseFormatted,
  parseMask,
  DEFAULT_TOKENS,
  MASK_PRESETS,
  type MaskTokens,
} from "@/registry/miseui/ui/mask-input-math"

interface MaskStateOptions {
  /** A preset name (date, time, phone, card) or a pattern. `#` digit, `A` letter in capitals, `a` letter, `*` either, `\` escapes. */
  mask: string
  /** Extra tokens, merged over the built-in ones. */
  tokens?: MaskTokens
  /** The raw value, without literals. */
  value?: string
  defaultValue?: string
  onValueChange?: (raw: string, masked: string) => void
  /** Fires when the last slot is filled. */
  onComplete?: (raw: string, masked: string) => void
}

function useMaskState({ mask, tokens, value, defaultValue = "", onValueChange, onComplete }: MaskStateOptions) {
  const pattern = MASK_PRESETS[mask] ?? mask
  const slots = useMemo(() => parseMask(pattern, tokens ? { ...DEFAULT_TOKENS, ...tokens } : DEFAULT_TOKENS), [pattern, tokens])
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const given = value ?? uncontrolled
  // A saved value may already carry the literals.
  const raw = conform(parseFormatted(given, slots) ?? given, slots)
  const masked = formatMasked(raw, slots)
  const [caret, setCaret] = useState(0)
  const [focused, setFocused] = useState(false)

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const inputType = (event.nativeEvent as InputEvent).inputType
    const result = applyEdit(raw, slots, input.value, input.selectionStart ?? input.value.length, inputType)
    // Written straight to the element: React only restores a value that differs, so the caret set here survives, even when a key was rejected and no state changes.
    input.value = result.masked
    input.setSelectionRange(result.caret, result.caret)
    setCaret(result.caret)
    if (result.raw === raw) return
    setUncontrolled(result.raw)
    onValueChange?.(result.raw, result.masked)
    if (isComplete(result.raw, slots)) onComplete?.(result.raw, result.masked)
  }
  /** Setting the range from code does not reliably raise a select event, so the state is told directly. */
  const moveCaret = (input: HTMLInputElement, position: number) => {
    input.setSelectionRange(position, position)
    setCaret(position)
  }
  const syncCaret = (event: React.SyntheticEvent<HTMLInputElement>) => setCaret(event.currentTarget.selectionStart ?? 0)
  const handlers = {
    onChange,
    onSelect: syncCaret,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  }
  return { slots, raw, masked, caret, focused, handlers, moveCaret }
}

export { useMaskState, type MaskStateOptions }
