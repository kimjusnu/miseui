import { acceptCharacters, capacity, conform, formatMasked, parseFormatted, type MaskSlot } from "@/registry/miseui/ui/mask-input-math"

function rawIndexAt(position: number, slots: readonly MaskSlot[]) {
  return slots.slice(0, Math.max(0, position)).filter((slot) => slot.kind === "token").length
}

/** The masked position just after the raw character before `rawPosition`. `skip` moves past literals, for the next typed key. */
function caretForRaw(rawPosition: number, slots: readonly MaskSlot[], maskedLength: number, skip: boolean) {
  let seen = 0
  let position = 0
  while (position < slots.length && seen < rawPosition) {
    if (slots[position].kind === "token") seen += 1
    position += 1
  }
  if (skip || rawPosition === 0) {
    while (position < slots.length && slots[position].kind === "literal") position += 1
  }
  return Math.min(position, maskedLength)
}

interface MaskEdit {
  start: number
  end: number
  inserted: string
}

/**
 * Works out the edit from the text and caret after it happened. The text after the caret cannot have changed, which
 * covers typing, paste, cut, word delete and autofill alike, and phones that never send a usable key name for Backspace.
 */
function diffEdit(previous: string, next: string, caret: number): MaskEdit {
  const end = Math.max(0, previous.length - (next.length - caret))
  const limit = Math.min(caret, end)
  let start = 0
  while (start < limit && previous[start] === next[start]) start += 1
  return { start, end, inserted: next.slice(start, caret) }
}

interface MaskResult {
  raw: string
  masked: string
  caret: number
}

function finish(raw: string, slots: readonly MaskSlot[], rawCaret: number, skip: boolean): MaskResult {
  const fitted = conform(raw, slots)
  const masked = formatMasked(fitted, slots)
  const clamped = Math.min(rawCaret, Array.from(fitted).length)
  return { raw: fitted, masked, caret: caretForRaw(clamped, slots, masked.length, skip) }
}

/** Applies what the browser just did to the field, returning the corrected value and where the caret belongs. */
function applyEdit(rawBefore: string, slots: readonly MaskSlot[], text: string, caret: number, inputType = ""): MaskResult {
  const previous = formatMasked(rawBefore, slots)
  const { start, end, inserted } = diffEdit(previous, text, caret)
  const raw = Array.from(rawBefore)
  const rawStart = rawIndexAt(start, slots)
  const rawEnd = rawIndexAt(end, slots)
  if (inserted === "" && start !== end && rawStart === rawEnd) {
    // Only literals were removed, and they would just come back. The person meant the character beside them.
    if (inputType === "deleteContentForward") {
      return finish([...raw.slice(0, rawStart), ...raw.slice(rawStart + 1)].join(""), slots, rawStart, false)
    }
    return finish([...raw.slice(0, Math.max(0, rawStart - 1)), ...raw.slice(rawStart)].join(""), slots, Math.max(0, rawStart - 1), false)
  }
  const kept = [...raw.slice(0, rawStart), ...raw.slice(rawEnd)]
  const free = capacity(slots) - kept.length
  const source = parseFormatted(inserted, slots) ?? inserted
  const accepted = Array.from(acceptCharacters(source, slots, rawStart, free))
  if (inserted !== "" && accepted.length === 0 && start === end) {
    // A rejected key: nothing moved, so neither does the caret.
    return { raw: rawBefore, masked: previous, caret: start }
  }
  const nextRaw = [...raw.slice(0, rawStart), ...accepted, ...raw.slice(rawEnd)].join("")
  return finish(nextRaw, slots, rawStart + accepted.length, accepted.length > 0)
}

export { applyEdit, caretForRaw, diffEdit, rawIndexAt, type MaskResult }
