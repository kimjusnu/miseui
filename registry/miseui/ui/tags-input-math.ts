interface TagMessages {
  duplicate: (tag: string) => string
  max: (max: number) => string
}

interface TagRules {
  max?: number
  /** Return a sentence to refuse the tag, or nothing to accept it. */
  validate?: (tag: string, tags: readonly string[]) => string | null | undefined
  messages: TagMessages
}

const DEFAULT_TAG_MESSAGES: TagMessages = {
  duplicate: (tag) => `${tag} is already added.`,
  max: (max) => (max === 1 ? "Only one tag can be added." : `Only ${max} tags can be added.`),
}

/** Comma from typing; new lines and tabs because a pasted spreadsheet column separates with those. */
function parseTags(text: string) {
  return text.split(/[,\n\r\t]+/).map((part) => part.trim()).filter(Boolean)
}

function refusal(tag: string, tags: readonly string[], rules: TagRules) {
  const lower = tag.toLowerCase()
  if (tags.some((entry) => entry.toLowerCase() === lower)) return rules.messages.duplicate(tag)
  if (rules.max !== undefined && tags.length >= rules.max) return rules.messages.max(rules.max)
  return rules.validate?.(tag, tags) ?? null
}

/** Each candidate is checked against the tags accepted before it, so a paste cannot slip duplicates past the limit. */
function addTags(current: readonly string[], candidates: readonly string[], rules: TagRules) {
  return candidates.reduce<{ tags: readonly string[]; errors: readonly string[] }>(
    (result, tag) => {
      const reason = refusal(tag, result.tags, rules)
      return reason ? { ...result, errors: [...result.errors, reason] } : { ...result, tags: [...result.tags, tag] }
    },
    { tags: current, errors: [] },
  )
}

function filterSuggestions(suggestions: readonly string[], query: string, tags: readonly string[]) {
  const needle = query.trim().toLowerCase()
  const taken = new Set(tags.map((tag) => tag.toLowerCase()))
  return suggestions.filter((entry) => {
    const lower = entry.toLowerCase()
    return !taken.has(lower) && lower.includes(needle)
  })
}

export { DEFAULT_TAG_MESSAGES, addTags, filterSuggestions, parseTags, type TagMessages, type TagRules }
