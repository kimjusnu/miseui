import type * as React from "react"
import { useEffect, useId, useRef } from "react"
import { Check, Loader2 } from "lucide-react"
import { motion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import type { ComboboxGroup, ComboboxOption } from "@/registry/miseui/ui/combobox-state"
import { cn } from "@/registry/miseui/lib/utils"

interface RowContext {
  listId: string
  rich: boolean
  spring: boolean
  reduceMotion: boolean
  activeValue: string | null
  selected: readonly string[]
  visible: readonly ComboboxOption[]
  onHover: (value: string) => void
  onPick: (option: ComboboxOption) => void
}

const optionId = (listId: string, index: number) => `${listId}-option-${index}`

function RowHighlight({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      data-slot="combobox-highlight"
      data-reduced={reduceMotion ? "true" : "false"}
      layoutId={reduceMotion ? undefined : "combobox-highlight"}
      transition={SPRING_DEFAULT}
      className="absolute inset-0 -z-10 rounded-sm bg-mise-soft"
    />
  )
}

function ComboboxRow({ option, context }: { option: ComboboxOption; context: RowContext }) {
  const { listId, rich, spring, reduceMotion, activeValue, selected, visible, onHover, onPick } = context
  const ref = useRef<HTMLDivElement>(null)
  const active = option.value === activeValue
  const isSelected = selected.includes(option.value)
  useEffect(() => {
    // Arrow keys can move past the fold; the pointer never can, and "nearest" does nothing when already visible.
    if (active) ref.current?.scrollIntoView({ block: "nearest" })
  }, [active])
  return (
    <div
      ref={ref}
      id={optionId(listId, visible.indexOf(option))}
      role="option"
      aria-selected={isSelected}
      aria-disabled={option.disabled ? true : undefined}
      data-slot="combobox-option"
      data-active={active ? "true" : "false"}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm px-2 text-sm select-none",
        rich ? "min-h-12 py-1.5" : "min-h-9 py-1.5 pointer-coarse:min-h-10",
        "aria-disabled:pointer-events-none aria-disabled:opacity-50",
        !spring && "data-[active=true]:bg-accent data-[active=true]:text-accent-foreground",
      )}
      onPointerMove={() => {
        if (!option.disabled && !active) onHover(option.value)
      }}
      // The search input keeps focus, and with it aria-activedescendant, while the pointer works the list.
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onPick(option)}
    >
      {spring && active ? <RowHighlight reduceMotion={reduceMotion} /> : null}
      {rich && option.media ? (
        <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
          {option.media}
        </span>
      ) : null}
      <span className="grid min-w-0 flex-1">
        <span className="truncate">{option.label}</span>
        {rich && option.description ? (
          <span className="truncate text-[13px] text-muted-foreground">{option.description}</span>
        ) : null}
      </span>
      {isSelected ? <Check aria-hidden="true" className="size-4 shrink-0" /> : null}
    </div>
  )
}

function ComboboxSection({ group, context }: { group: ComboboxGroup; context: RowContext }) {
  const headerId = useId()
  const rows = group.options.map((option) => <ComboboxRow key={option.value} option={option} context={context} />)
  if (!group.name) return rows
  return (
    <div role="group" aria-labelledby={headerId} className="not-first:mt-1">
      <div id={headerId} role="presentation" className="px-2 py-1.5 text-[13px] text-muted-foreground">
        {group.name}
      </div>
      {rows}
    </div>
  )
}

interface ComboboxListProps extends Omit<RowContext, "activeValue" | "visible"> {
  groups: readonly ComboboxGroup[]
  visible: readonly ComboboxOption[]
  active: ComboboxOption | null
  multiple: boolean
  loading: boolean
  loadingText: string
  emptyText: React.ReactNode
  label: string | undefined
}

/** The status sits outside the listbox, whose children may only be options and groups. */
function ComboboxList({ groups, visible, active, multiple, loading, loadingText, emptyText, label, ...row }: ComboboxListProps) {
  const context: RowContext = { ...row, visible, activeValue: active?.value ?? null }
  const empty = visible.length === 0
  return (
    <>
      <div role="status" className={cn(!loading && !empty && "sr-only")}>
        {loading ? (
          <span className="flex items-center gap-2 px-3 py-2 text-[13px] text-muted-foreground">
            <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
            {loadingText}
          </span>
        ) : empty ? (
          <span className="block px-3 py-6 text-center text-sm text-muted-foreground">{emptyText}</span>
        ) : null}
      </div>
      {/* layoutScroll: without it the highlight measures rows against the page and jumps once the list has scrolled. */}
      <motion.div
        layoutScroll
        id={row.listId}
        role="listbox"
        aria-label={label}
        aria-busy={loading ? true : undefined}
        aria-multiselectable={multiple ? true : undefined}
        // One stacking context for the list keeps a flying highlight behind every label, not just its own.
        className={cn("isolate max-h-72 overflow-y-auto", !empty && "p-1")}
      >
        {groups.map((group) => (
          <ComboboxSection key={group.name ?? "all"} group={group} context={context} />
        ))}
      </motion.div>
    </>
  )
}

export { ComboboxList, optionId }
