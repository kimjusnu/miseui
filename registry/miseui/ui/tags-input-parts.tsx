import type * as React from "react"
import { X } from "lucide-react"
import { motion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import type { TagsInputState } from "@/registry/miseui/ui/tags-input-state"
import { cn } from "@/registry/miseui/lib/utils"

type TagsInputVariant = "plain" | "inline" | "stacked" | "compact"

interface TagsInputLabels {
  remove: (tag: string) => string
  /** Read out for a focused tag, which has no visible instructions. */
  tag: (tag: string) => string
  add: string
  added: (tags: readonly string[]) => string
  removed: (tag: string) => string
  count: (count: number, max: number) => string
}

const TAG_CLASS: Record<TagsInputVariant, string> = {
  plain: "min-h-6 max-w-full gap-1 rounded-sm bg-secondary pr-1 pl-2 text-[13px] text-secondary-foreground",
  // No surface: words with commas between them, reading as a line of text.
  inline: "min-h-6 max-w-full gap-1 text-sm font-medium after:text-muted-foreground after:content-[','] last:after:content-none",
  stacked: "min-h-10 w-full justify-between gap-2 border-b py-1 text-sm",
  compact: "h-6 shrink-0 gap-1 rounded-sm bg-secondary px-1 text-[13px] text-secondary-foreground",
}

const REMOVE_CLASS = cn(
  "relative flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground",
  // A 16 px glyph with a 40 px touch target that sits over the gap around it.
  "after:absolute after:top-1/2 after:left-1/2 after:size-6 after:-translate-x-1/2 after:-translate-y-1/2 pointer-coarse:after:size-10",
  "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent hover:text-foreground",
  "[&_svg]:size-3",
)

interface TagProps {
  tag: string
  variant: TagsInputVariant
  labels: TagsInputLabels
  pop: boolean
  state: TagsInputState
}

function Tag({ tag, variant, labels, pop, state }: TagProps) {
  const shared = {
    "data-slot": "tags-input-tag",
    "data-tag": tag,
    tabIndex: state.disabled ? undefined : -1,
    "aria-label": labels.tag(tag),
    className: cn(
      "flex items-center rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
      TAG_CLASS[variant],
    ),
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => state.onTagKeyDown(event, tag),
  }
  const children = (
    <>
      <span className="min-w-0 break-words" title={tag}>{tag}</span>
      {state.disabled ? null : (
        <button
          type="button"
          // Out of the tab order: arrows reach the tag and Backspace removes it, and a stop per chip would make the field a long walk.
          tabIndex={-1}
          aria-label={labels.remove(tag)}
          className={REMOVE_CLASS}
          onClick={() => state.removeByButton(tag)}
        >
          <X aria-hidden="true" />
        </button>
      )}
    </>
  )
  if (!pop) return <li {...shared}>{children}</li>
  return (
    <motion.li
      {...shared}
      layout="position"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={SPRING_DEFAULT}
    >
      {children}
    </motion.li>
  )
}

function Suggestions({ state, label }: { state: TagsInputState; label?: string }) {
  if (state.matches.length === 0) return null
  return (
    <ul
      id={state.listboxId}
      role="listbox"
      aria-label={label}
      data-slot="tags-input-suggestions"
      className="absolute top-full right-0 left-0 z-20 mt-1 grid max-h-56 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      // Keeps focus in the input, or the blur would close the list before the click lands.
      onMouseDown={(event) => event.preventDefault()}
    >
      {state.matches.map((entry, index) => (
        <li
          key={entry}
          id={`${state.listboxId}-${index}`}
          role="option"
          aria-selected={index === state.activeIndex}
          className={cn(
            "flex min-h-8 cursor-default items-center rounded-sm px-2 text-sm pointer-coarse:min-h-10",
            index === state.activeIndex ? "bg-accent" : "hover:bg-accent/50",
          )}
          onClick={() => {
            state.commit(entry)
            state.setOpen(false)
          }}
          onMouseEnter={() => state.setActiveIndex(index)}
        >
          {entry}
        </li>
      ))}
    </ul>
  )
}

export { Suggestions, Tag, type TagsInputLabels, type TagsInputVariant }
