interface InputKeyContext {
  draft: string
  tags: readonly string[]
  matchCount: number
  suggestionCount: number
  active: string | null
  commit: (text: string, keepOnRefusal?: boolean) => void
  removeLast: () => void
  focusTag: (tag: string) => void
  moveActive: (delta: 1 | -1) => void
  setOpen: (open: boolean) => void
}

/** Each action returns whether it used the key, which decides whether the browser still gets it. */
function inputKeyActions(field: HTMLInputElement, context: InputKeyContext): Record<string, () => boolean> {
  const { draft, tags, matchCount, suggestionCount, active, commit, removeLast, focusTag, moveActive, setOpen } = context
  return {
    Enter: () => {
      // An empty field lets Enter through, so the surrounding form still submits.
      if (!active && !draft.trim()) return false
      commit(active ?? draft)
      setOpen(false)
      return true
    },
    ",": () => {
      commit(draft)
      return true
    },
    Backspace: () => {
      if (draft) return false
      removeLast()
      return true
    },
    ArrowLeft: () => {
      const atStart = field.selectionStart === 0 && field.selectionEnd === 0
      if (!atStart || tags.length === 0) return false
      focusTag(tags[tags.length - 1])
      return true
    },
    ArrowDown: () => {
      setOpen(true)
      moveActive(1)
      return suggestionCount > 0
    },
    ArrowUp: () => {
      moveActive(-1)
      return matchCount > 0
    },
    Escape: () => {
      setOpen(false)
      return matchCount > 0
    },
  }
}

function tagKeyActions(tag: string, tags: readonly string[], focusInput: () => void, focusTag: (tag: string) => void, removeWithFocus: (tag: string, next: string) => void): Record<string, () => void> {
  const index = tags.indexOf(tag)
  const remove = () => removeWithFocus(tag, tags[index - 1] ?? tags[index + 1] ?? "input")
  return {
    ArrowLeft: () => {
      if (index > 0) focusTag(tags[index - 1])
    },
    ArrowRight: () => {
      if (index + 1 < tags.length) focusTag(tags[index + 1])
      else focusInput()
    },
    End: focusInput,
    Backspace: remove,
    Delete: remove,
  }
}

export { inputKeyActions, tagKeyActions }
