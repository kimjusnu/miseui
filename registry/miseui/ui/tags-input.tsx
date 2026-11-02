import type * as React from "react"
import { useEffect, useId, useRef } from "react"
import { useReducedMotion } from "motion/react"
import { TagsField } from "@/registry/miseui/ui/tags-input-field"
import { DEFAULT_TAG_MESSAGES, type TagMessages } from "@/registry/miseui/ui/tags-input-math"
import type { TagsInputLabels, TagsInputVariant } from "@/registry/miseui/ui/tags-input-parts"
import { useTagsInputState } from "@/registry/miseui/ui/tags-input-state"
import { cn } from "@/registry/miseui/lib/utils"

type TagsInputEffect = "pop"

const DEFAULT_LABELS: TagsInputLabels = {
  remove: (tag) => `Remove ${tag}`,
  tag: (tag) => `${tag}. Press Backspace to remove.`,
  add: "Add",
  added: (tags) => `Added ${tags.join(", ")}`,
  removed: (tag) => `Removed ${tag}`,
  count: (count, max) => `${count} of ${max}`,
}

type RootAttributes = Omit<React.ComponentProps<"div">, "children" | "defaultValue" | "onChange">

interface TagsInputProps extends RootAttributes {
  value?: readonly string[]
  defaultValue?: readonly string[]
  onValueChange?: (tags: string[]) => void
  /** `plain` chips in a field, `inline` words on a rule, `stacked` a field over a list of rows, `compact` one scrolling line. */
  variant?: TagsInputVariant
  /** `pop` scales tags in and out on a spring, and the others slide over to make room. */
  effect?: TagsInputEffect
  max?: number
  /** Return a sentence to refuse a tag, or nothing to accept it. */
  validate?: (tag: string, tags: readonly string[]) => string | null | undefined
  /** Offered as you type. Free text is still allowed. */
  suggestions?: readonly string[]
  placeholder?: string
  disabled?: boolean
  /** Posts each tag with the surrounding form. */
  name?: string
  labels?: Partial<TagsInputLabels>
  messages?: Partial<TagMessages>
}

const EMPTY: readonly string[] = []

function TagsInput({
  value, defaultValue = EMPTY, onValueChange, variant = "plain", effect, max, validate, suggestions = EMPTY,
  placeholder, disabled = false, name, labels, messages, className, "aria-label": ariaLabel, ...props
}: TagsInputProps) {
  const errorId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const reduceMotion = useReducedMotion() ?? false
  const merged = { ...DEFAULT_LABELS, ...labels }
  const state = useTagsInputState(
    {
      controlled: value, initial: defaultValue, suggestions, disabled, max, validate, onValueChange,
      messages: { ...DEFAULT_TAG_MESSAGES, ...messages },
      onAnnounce: (added, removed) => (removed === null ? merged.added(added) : merged.removed(removed)),
    },
    { inputRef, listRef },
  )
  const { tags } = state
  // Compact is one line, so a new tag would otherwise land out of sight.
  useEffect(() => {
    const list = listRef.current
    if (list && variant === "compact") list.scrollLeft = list.scrollWidth
  }, [tags.length, variant])
  return (
    <div data-slot="tags-input" data-variant={variant} data-effect={effect} className={cn("grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-1", className)} {...props}>
      {name ? tags.map((tag) => <input key={tag} type="hidden" name={name} value={tag} />) : null}
      <TagsField
        state={state} variant={variant} labels={merged} pop={effect === "pop" && !reduceMotion} placeholder={placeholder} ariaLabel={ariaLabel}
        errorId={errorId} hasSuggestions={suggestions.length > 0} inputRef={inputRef} listRef={listRef}
      />
      <div className="flex items-start justify-between gap-2 text-[13px]">
        {state.error ? <p id={errorId} role="alert" className="min-w-0 break-words text-destructive">{state.error}</p> : <span />}
        {max !== undefined ? <span data-slot="tags-input-count" className="shrink-0 text-muted-foreground tabular-nums">{merged.count(tags.length, max)}</span> : null}
      </div>
      <span className="sr-only" aria-live="polite">{state.status}</span>
    </div>
  )
}

export { TagsInput, type TagsInputProps, type TagsInputVariant, type TagsInputEffect, type TagsInputLabels, type TagMessages }
