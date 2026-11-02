import type * as React from "react"
import { useEffect, useId, useRef, useState } from "react"
import { inputKeyActions, tagKeyActions } from "@/registry/miseui/ui/tags-input-keys"
import { addTags, filterSuggestions, parseTags, type TagRules } from "@/registry/miseui/ui/tags-input-math"

interface TagsStateOptions extends TagRules {
  controlled?: readonly string[]
  initial: readonly string[]
  suggestions: readonly string[]
  disabled: boolean
  onValueChange?: (tags: string[]) => void
  onAnnounce: (added: readonly string[], removed: string | null) => string
}

interface TagsRefs {
  inputRef: React.RefObject<HTMLInputElement | null>
  listRef: React.RefObject<HTMLUListElement | null>
}

/** The value, what was last refused and the sentence read out to assistive tech. */
function useTagsValue(options: TagsStateOptions) {
  const { controlled, initial, max, validate, messages, onValueChange, onAnnounce } = options
  const [uncontrolled, setUncontrolled] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState("")
  const tags = controlled ?? uncontrolled
  const replace = (next: readonly string[]) => {
    setUncontrolled(next)
    onValueChange?.([...next])
  }
  const add = (candidates: readonly string[]) => {
    const result = addTags(tags, candidates, { max, validate, messages })
    const added = result.tags.slice(tags.length)
    setError(result.errors[0] ?? null)
    if (added.length) {
      replace(result.tags)
      setStatus(onAnnounce(added, null))
    }
    return result.errors.length === 0
  }
  const remove = (tag: string) => {
    replace(tags.filter((entry) => entry !== tag))
    setError(null)
    setStatus(onAnnounce([], tag))
  }
  return { tags, error, setError, status, add, remove }
}

function findTag(list: HTMLElement | null, tag: string) {
  const rows = list?.querySelectorAll<HTMLElement>("[data-slot='tags-input-tag']") ?? []
  return Array.from(rows).find((row) => row.dataset.tag === tag)
}

/** Reads the rendered tags because the value only changes on the next render, which is when the focus has to land. */
function useTagFocus(tags: readonly string[], { inputRef, listRef }: TagsRefs) {
  const pending = useRef<string | "input" | null>(null)
  const focusTag = (tag: string) => findTag(listRef.current, tag)?.focus()
  useEffect(() => {
    const target = pending.current
    if (target === null) return
    pending.current = null
    if (target === "input") inputRef.current?.focus()
    else findTag(listRef.current, target)?.focus()
  }, [tags, inputRef, listRef])
  const focusAfterRender = (target: string | "input") => {
    pending.current = target
  }
  return { focusTag, focusAfterRender }
}

function useTagsDraft(add: (candidates: readonly string[]) => boolean, setError: (error: string | null) => void) {
  const [draft, setDraft] = useState("")
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  // Keeps a refused word in the field to fix; a paste of many has nothing single to keep.
  const commit = (text: string, keepOnRefusal = true) => {
    const candidates = parseTags(text)
    if (candidates.length === 0) return
    const accepted = add(candidates)
    if (accepted || candidates.length > 1 || !keepOnRefusal) setDraft("")
    setActiveIndex(-1)
  }
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    // Phone keyboards send no comma keydown, so it can only be caught here. Not while an IME is still composing.
    if (!(event.nativeEvent as InputEvent).isComposing && value.includes(",")) {
      commit(value, false)
      return
    }
    setDraft(value)
    setError(null)
    setOpen(true)
    setActiveIndex(-1)
  }
  const onPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text")
    if (!/[,\n\r\t]/.test(text)) return
    event.preventDefault()
    commit(`${draft}${text}`, false)
  }
  return { draft, open, setOpen, activeIndex, setActiveIndex, commit, onChange, onPaste }
}

function useTagsInputState(options: TagsStateOptions, refs: TagsRefs) {
  const { suggestions, disabled } = options
  const listboxId = useId()
  const { tags, error, setError, status, add, remove } = useTagsValue(options)
  const { focusTag, focusAfterRender } = useTagFocus(tags, refs)
  const { draft, open, setOpen, activeIndex, setActiveIndex, commit, onChange, onPaste } = useTagsDraft(add, setError)
  const matches = open ? filterSuggestions(suggestions, draft, tags) : []
  const active = matches[activeIndex] ?? null
  const moveActive = (delta: 1 | -1) => {
    if (matches.length) setActiveIndex((activeIndex + delta + matches.length) % matches.length)
  }
  const removeLast = () => {
    const last = tags[tags.length - 1]
    if (last !== undefined) remove(last)
  }
  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter during composition is the IME accepting a syllable, not the person accepting a tag.
    if (event.nativeEvent.isComposing) return
    const actions = inputKeyActions(event.currentTarget, {
      draft, tags, matchCount: matches.length, suggestionCount: suggestions.length, active, commit, removeLast, focusTag, moveActive, setOpen,
    })
    if (actions[event.key]?.()) event.preventDefault()
  }
  const focusInput = () => refs.inputRef.current?.focus()
  const removeWithFocus = (tag: string, next: string) => {
    focusAfterRender(next)
    remove(tag)
  }
  const onTagKeyDown = (event: React.KeyboardEvent<HTMLElement>, tag: string) => {
    const action = tagKeyActions(tag, tags, focusInput, focusTag, removeWithFocus)[event.key]
    if (!action) return
    event.preventDefault()
    action()
  }
  const removeByButton = (tag: string) => removeWithFocus(tag, "input")
  return {
    listboxId, tags, error, status, draft, matches, activeIndex, active, disabled,
    onChange, onInputKeyDown, onPaste, onTagKeyDown, removeByButton, commit, setOpen, setActiveIndex, focusInput,
  }
}

type TagsInputState = ReturnType<typeof useTagsInputState>

export { useTagsInputState, type TagsInputState }
