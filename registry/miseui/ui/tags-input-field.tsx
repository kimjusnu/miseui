import type * as React from "react"
import { AnimatePresence } from "motion/react"
import { Suggestions, Tag, type TagsInputLabels, type TagsInputVariant } from "@/registry/miseui/ui/tags-input-parts"
import type { TagsInputState } from "@/registry/miseui/ui/tags-input-state"
import { cn } from "@/registry/miseui/lib/utils"

const FIELD_FOCUS_CLASS = "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
const FIELD_CLASS: Record<TagsInputVariant, string> = {
  plain: cn("flex min-h-9 flex-wrap items-center gap-1 rounded-md border border-input px-2 py-1 shadow-xs pointer-coarse:min-h-10", FIELD_FOCUS_CLASS),
  inline: "flex min-h-9 flex-wrap items-center gap-x-2 gap-y-1 border-b border-input py-1 focus-within:border-foreground",
  stacked: "flex items-center gap-2",
  compact: cn("flex h-8 items-center gap-1 rounded-md border border-input px-2 shadow-xs pointer-coarse:h-10", FIELD_FOCUS_CLASS),
}
const LIST_CLASS: Record<TagsInputVariant, string> = {
  plain: "contents",
  inline: "contents",
  stacked: "grid",
  // A horizontal scroller: its clip is square on purpose, and the rounded field around it has room to spare.
  compact: "flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
}
const BARE_INPUT_CLASS = "h-6 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
const INPUT_CLASS: Record<TagsInputVariant, string> = {
  // Wider on the layouts that wrap, so the field moves to its own line before a placeholder is cut off.
  plain: cn(BARE_INPUT_CLASS, "min-w-24 md:text-sm"),
  inline: cn(BARE_INPUT_CLASS, "min-w-24 md:text-sm"),
  stacked: cn(
    "h-9 w-full min-w-0 flex-1 rounded-md border border-input bg-transparent px-3 text-base shadow-xs outline-none placeholder:text-muted-foreground md:text-sm pointer-coarse:h-10",
    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  ),
  compact: cn(BARE_INPUT_CLASS, "min-w-16 md:text-[13px]"),
}

/** Only as a stacked row does the commit need a button: there the field has no tags around it to explain the pattern. */
function AddButton({ state, label }: { state: TagsInputState; label: string }) {
  return (
    <button
      type="button"
      disabled={state.disabled || !state.draft.trim()}
      className="h-9 shrink-0 rounded-md border px-3 text-sm font-medium outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 pointer-coarse:h-10"
      onClick={() => {
        state.commit(state.draft)
        state.focusInput()
      }}
    >
      {label}
    </button>
  )
}

interface TagsFieldProps {
  state: TagsInputState
  variant: TagsInputVariant
  labels: TagsInputLabels
  pop: boolean
  placeholder?: string
  ariaLabel?: string
  errorId: string
  hasSuggestions: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  listRef: React.RefObject<HTMLUListElement | null>
}

type TagsInputBoxProps = Pick<TagsFieldProps, "state" | "variant" | "placeholder" | "ariaLabel" | "errorId" | "hasSuggestions" | "inputRef">

function TagsInputBox({ state, variant, placeholder, ariaLabel, errorId, hasSuggestions, inputRef }: TagsInputBoxProps) {
  const activeId = state.active ? `${state.listboxId}-${state.activeIndex}` : undefined
  return (
    <input
      ref={inputRef}
      data-slot="tags-input-field"
      role={hasSuggestions ? "combobox" : undefined}
      aria-label={ariaLabel}
      aria-expanded={hasSuggestions ? state.matches.length > 0 : undefined}
      aria-controls={hasSuggestions && state.matches.length > 0 ? state.listboxId : undefined}
      aria-autocomplete={hasSuggestions ? "list" : undefined}
      aria-activedescendant={activeId}
      aria-invalid={state.error ? true : undefined}
      aria-describedby={state.error ? errorId : undefined}
      autoComplete="off"
      disabled={state.disabled}
      placeholder={placeholder}
      value={state.draft}
      className={INPUT_CLASS[variant]}
      onChange={state.onChange}
      onKeyDown={state.onInputKeyDown}
      onPaste={state.onPaste}
      onFocus={() => state.setOpen(true)}
      onBlur={() => state.setOpen(false)}
    />
  )
}

function TagsList({ state, variant, labels, pop, listRef }: Pick<TagsFieldProps, "state" | "variant" | "labels" | "pop" | "listRef">) {
  if (state.tags.length === 0 && variant === "stacked") return null
  const rows = state.tags.map((tag) => <Tag key={tag} tag={tag} variant={variant} labels={labels} pop={pop} state={state} />)
  return (
    <ul ref={listRef} data-slot="tags-input-list" className={LIST_CLASS[variant]}>
      {pop ? <AnimatePresence initial={false} mode="popLayout">{rows}</AnimatePresence> : rows}
    </ul>
  )
}

function TagsField({ state, variant, labels, pop, listRef, ...input }: TagsFieldProps) {
  const box = <TagsInputBox state={state} variant={variant} {...input} />
  const list = <TagsList state={state} variant={variant} labels={labels} pop={pop} listRef={listRef} />
  if (variant === "stacked") {
    return (
      <>
        <div className={cn("relative", FIELD_CLASS.stacked)}>
          {box}
          <AddButton state={state} label={labels.add} />
          <Suggestions state={state} label={input.ariaLabel} />
        </div>
        {list}
      </>
    )
  }
  return (
    <div
      data-slot="tags-input-frame"
      className={cn("relative cursor-text", FIELD_CLASS[variant], state.disabled && "pointer-events-none opacity-50")}
      onClick={(event) => {
        if (event.target === event.currentTarget) state.focusInput()
      }}
    >
      {list}
      {box}
      <Suggestions state={state} label={input.ariaLabel} />
    </div>
  )
}

export { TagsField }
