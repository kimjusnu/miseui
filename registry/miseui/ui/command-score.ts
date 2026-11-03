import type * as React from "react"

interface CommandMatch {
  score: number
  /** Positions in the text that matched, for drawing them. */
  indices: readonly number[]
}

interface CommandItem {
  value: string
  label: string
  description?: string
  /** Section heading. Items without one sit in an untitled section. */
  group?: string
  /** Extra words that should find this item, such as synonyms. */
  keywords?: readonly string[]
  /** Keys to show on the right, one entry per key. */
  shortcut?: readonly string[]
  icon?: React.ReactNode
  disabled?: boolean
  onSelect?: () => void
}

interface CommandEntry {
  item: CommandItem
  indices: readonly number[]
}

interface CommandSection {
  key: string
  heading?: string
  entries: readonly CommandEntry[]
}

const MATCH_POINTS = 1
const CONSECUTIVE_BONUS = 6
const WORD_START_BONUS = 8
const FIRST_CHARACTER_BONUS = 4
const GAP_PENALTY = 1
/** Keywords are hidden from the reader, so a visible match of the same quality must win. */
const KEYWORD_FACTOR = 0.75
/** Longer strings add cost and no information: nobody searches for the eightieth letter of a label. */
const MAX_TEXT_LENGTH = 200
const WORD_BOUNDARY = /[\s\-_./:\\]/

function isWordStart(text: string, index: number) {
  if (index === 0) return true
  const previous = text[index - 1]
  if (WORD_BOUNDARY.test(previous)) return true
  return previous === previous.toLowerCase() && text[index] !== text[index].toLowerCase()
}

function characterBonus(text: string, index: number) {
  const start = isWordStart(text, index) ? WORD_START_BONUS : 0
  return MATCH_POINTS + start + (index === 0 ? FIRST_CHARACTER_BONUS : 0)
}

/** Walks back through the table of best predecessors to recover which letters the winning match used. */
function backtrack(from: Int16Array[], rows: number, column: number) {
  const indices: number[] = []
  let at = column
  for (let row = rows - 1; row >= 0; row -= 1) {
    indices.unshift(at)
    at = from[row][at]
  }
  return indices
}

/**
 * Best alignment of the query as a subsequence of the text, or null when it is not one. Dynamic programming rather
 * than a greedy scan, because the first occurrence of a letter is often not the one that starts a word: "gp" should
 * land on the capitals of "Go to Projects". Runs in O(query length x text length).
 */
function fuzzyScore(query: string, text: string): CommandMatch | null {
  const clipped = text.slice(0, MAX_TEXT_LENGTH)
  const lowered = clipped.toLowerCase()
  // A few characters change length when lowered, which would shift every index, so those match as written.
  const haystack = lowered.length === clipped.length ? lowered : clipped
  const needle = query.toLowerCase().replace(/\s+/g, "")
  if (needle.length === 0) return { score: 0, indices: [] }
  if (needle.length > haystack.length) return null
  const columns = haystack.length
  const from = Array.from({ length: needle.length }, () => new Int16Array(columns).fill(-1))
  let previous = new Float64Array(columns).fill(Number.NEGATIVE_INFINITY)
  for (let row = 0; row < needle.length; row += 1) {
    const current = new Float64Array(columns).fill(Number.NEGATIVE_INFINITY)
    let carry = Number.NEGATIVE_INFINITY
    let carryFrom = -1
    for (let column = 0; column < columns; column += 1) {
      if (column > 0 && previous[column - 1] - GAP_PENALTY > carry - GAP_PENALTY) {
        carry = previous[column - 1]
        carryFrom = column - 1
      }
      carry -= GAP_PENALTY
      if (haystack[column] !== needle[row]) continue
      const bonus = characterBonus(clipped, column)
      if (row === 0) {
        current[column] = bonus - column * GAP_PENALTY * 0.5
        continue
      }
      const adjacent = column > 0 ? previous[column - 1] + CONSECUTIVE_BONUS : Number.NEGATIVE_INFINITY
      const best = Math.max(adjacent, carry)
      if (best === Number.NEGATIVE_INFINITY) continue
      current[column] = best + bonus
      from[row][column] = adjacent >= carry ? column - 1 : carryFrom
    }
    previous = current
  }
  let score = Number.NEGATIVE_INFINITY
  let end = -1
  previous.forEach((value, column) => {
    if (value > score) {
      score = value
      end = column
    }
  })
  return end === -1 ? null : { score, indices: backtrack(from, needle.length, end) }
}

function scoreItem(item: CommandItem, query: string): CommandMatch | null {
  const label = fuzzyScore(query, item.label)
  const keywordScores = (item.keywords ?? []).flatMap((keyword) => {
    const match = fuzzyScore(query, keyword)
    return match ? [match.score * KEYWORD_FACTOR] : []
  })
  const keyword = keywordScores.length > 0 ? Math.max(...keywordScores) : Number.NEGATIVE_INFINITY
  if (label && label.score >= keyword) return label
  return keyword === Number.NEGATIVE_INFINITY ? null : { score: keyword, indices: [] }
}

function groupKey(item: CommandItem) {
  return item.group ?? ""
}

function browseSections(items: readonly CommandItem[], recent: readonly string[], recentLabel: string): CommandSection[] {
  const recentItems = recent.flatMap((value) => items.filter((item) => item.value === value && !item.disabled))
  const recentValues = new Set(recentItems.map((item) => item.value))
  const rest = items.filter((item) => !recentValues.has(item.value))
  const groups = [...new Set(rest.map(groupKey))]
  const sections = groups.map((group) => ({
    key: `group:${group}`,
    heading: group || undefined,
    entries: rest.filter((item) => groupKey(item) === group).map((item) => ({ item, indices: [] })),
  }))
  if (recentItems.length === 0) return sections
  return [{ key: "recent", heading: recentLabel, entries: recentItems.map((item) => ({ item, indices: [] })) }, ...sections]
}

function searchSections(items: readonly CommandItem[], query: string): CommandSection[] {
  const matched = items.flatMap((item) => {
    const match = scoreItem(item, query)
    return match ? [{ item, ...match }] : []
  })
  const ranked = [...matched].sort((a, b) => b.score - a.score)
  // Sections follow their best result, so the top hit is always the first row.
  const groups = [...new Set(ranked.map(({ item }) => groupKey(item)))]
  return groups.map((group) => ({
    key: `group:${group}`,
    heading: group || undefined,
    entries: ranked.filter(({ item }) => groupKey(item) === group).map(({ item, indices }) => ({ item, indices })),
  }))
}

/** Recent items lead only while browsing: once someone types, the query alone decides. */
function buildSections(items: readonly CommandItem[], query: string, recent: readonly string[], recentLabel: string, recentOnly = false) {
  if (query.trim()) return searchSections(items, query)
  const sections = browseSections(items, recent, recentLabel)
  return recentOnly ? sections.filter((section) => section.key === "recent") : sections
}

/** Newest first, no duplicates, capped: the list to keep after someone runs a command. */
function pushRecent(recent: readonly string[], value: string, limit = 5) {
  return [value, ...recent.filter((entry) => entry !== value)].slice(0, limit)
}

export { buildSections, fuzzyScore, pushRecent, scoreItem, type CommandEntry, type CommandItem, type CommandMatch, type CommandSection }
