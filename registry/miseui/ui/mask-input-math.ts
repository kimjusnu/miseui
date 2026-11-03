/**
 * A mask is a row of slots, one per character. That one-to-one mapping is what keeps the maths simple: position N in
 * the masked text is slot N, so a caret can be translated to a place in the raw value by counting token slots.
 */
interface MaskToken {
  test: (character: string) => boolean
  /** Must return one character, or positions stop lining up. */
  transform?: (character: string) => string
  /** Lets the field ask for the number keyboard on a phone. */
  numeric?: boolean
}

type MaskTokens = Readonly<Record<string, MaskToken>>
type MaskSlot = { kind: "token"; token: MaskToken } | { kind: "literal"; character: string }

const DEFAULT_TOKENS: MaskTokens = {
  "#": { test: (character) => /^[0-9]$/.test(character), numeric: true },
  A: { test: (character) => /^\p{L}$/u.test(character), transform: (character) => character.toUpperCase() },
  a: { test: (character) => /^\p{L}$/u.test(character) },
  "*": { test: (character) => /^[\p{L}\p{N}]$/u.test(character) },
}

const MASK_PRESETS: Readonly<Record<string, string>> = {
  date: "##/##/####",
  time: "##:##",
  phone: "(###) ###-####",
  card: "#### #### #### ####",
}

function parseMask(pattern: string, tokens: MaskTokens = DEFAULT_TOKENS): readonly MaskSlot[] {
  const characters = Array.from(pattern)
  const slots: MaskSlot[] = []
  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index]
    // A backslash makes the next character literal, so a mask can contain a real # or A.
    if (character === "\\" && index + 1 < characters.length) {
      index += 1
      slots.push({ kind: "literal", character: characters[index] })
    } else {
      const token = tokens[character]
      slots.push(token ? { kind: "token", token } : { kind: "literal", character })
    }
  }
  return slots
}

function tokenSlots(slots: readonly MaskSlot[]) {
  return slots.filter((slot): slot is Extract<MaskSlot, { kind: "token" }> => slot.kind === "token")
}

const capacity = (slots: readonly MaskSlot[]) => tokenSlots(slots).length
const isNumericMask = (slots: readonly MaskSlot[]) => tokenSlots(slots).every(({ token }) => token.numeric === true)
const isComplete = (raw: string, slots: readonly MaskSlot[]) => Array.from(raw).length === capacity(slots) && capacity(slots) > 0

const shape = (token: MaskToken, character: string) => token.transform?.(character) ?? character

/** Characters that fit, starting at raw position `from`, up to `limit`. Anything else is skipped, which is how hyphens in a paste disappear. */
function acceptCharacters(text: string, slots: readonly MaskSlot[], from: number, limit: number) {
  const tokens = tokenSlots(slots)
  let accepted = ""
  let count = 0
  for (const character of Array.from(text)) {
    if (count >= limit) break
    const slot = tokens[from + count]
    if (!slot) break
    if (slot.token.test(character)) {
      accepted += shape(slot.token, character)
      count += 1
    }
  }
  return accepted
}

/** Raw values may arrive from outside or shift after a delete, so they are re-fitted to the slots every time. */
function conform(raw: string, slots: readonly MaskSlot[]) {
  return acceptCharacters(raw, slots, 0, capacity(slots))
}

/** Literals appear only up to the last typed character: a trailing one could not be deleted, because nothing would change. */
function formatMasked(raw: string, slots: readonly MaskSlot[]) {
  const characters = Array.from(raw)
  if (characters.length === 0) return ""
  let masked = ""
  let used = 0
  for (const slot of slots) {
    if (used >= characters.length) break
    if (slot.kind === "literal") {
      masked += slot.character
    } else {
      masked += characters[used]
      used += 1
    }
  }
  return masked
}

/** Reads text already shaped like this mask, returning its raw value, or null if it is not. "+82 10" must not yield raw 8210. */
function parseFormatted(text: string, slots: readonly MaskSlot[]) {
  const characters = Array.from(text)
  if (characters.length > slots.length) return null
  let raw = ""
  let sawLiteral = false
  for (let index = 0; index < characters.length; index += 1) {
    const slot = slots[index]
    const character = characters[index]
    if (slot.kind === "literal") {
      if (character !== slot.character) return null
      sawLiteral = true
    } else {
      if (!slot.token.test(character)) return null
      raw += shape(slot.token, character)
    }
  }
  return sawLiteral ? raw : null
}

interface MaskGroup {
  /** Masked position of the first character in this group. */
  start: number
  size: number
  text: string
}

/** Runs of token slots between literals: one box per group in `grouped`. */
function maskGroups(raw: string, slots: readonly MaskSlot[]): readonly MaskGroup[] {
  const characters = Array.from(raw)
  const groups: MaskGroup[] = []
  let used = 0
  let current: MaskGroup | null = null
  slots.forEach((slot, position) => {
    if (slot.kind === "literal") {
      current = null
      return
    }
    if (current === null) {
      current = { start: position, size: 0, text: "" }
      groups.push(current)
    }
    current.size += 1
    current.text += characters[used] ?? ""
    used += 1
  })
  return groups
}

/** Which group takes the next key. A full group with nothing after it hands over, so the highlight is ahead of the finger. */
function activeGroupIndex(groups: readonly MaskGroup[], caret: number, maskedLength: number) {
  const found = groups.findIndex((group) => caret <= group.start + group.size)
  if (found < 0) return groups.length - 1
  const group = groups[found]
  const handsOver = caret === maskedLength && caret === group.start + group.size && found < groups.length - 1
  return handsOver ? found + 1 : found
}

function placeholderFor(slots: readonly MaskSlot[], character = "_") {
  return slots.map((slot) => (slot.kind === "literal" ? slot.character : character)).join("")
}

export {
  activeGroupIndex,
  acceptCharacters,
  capacity,
  conform,
  formatMasked,
  isComplete,
  isNumericMask,
  maskGroups,
  parseFormatted,
  parseMask,
  placeholderFor,
  DEFAULT_TOKENS,
  MASK_PRESETS,
  type MaskGroup,
  type MaskSlot,
  type MaskToken,
  type MaskTokens,
}
