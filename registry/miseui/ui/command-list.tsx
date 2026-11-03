import type * as React from "react"
import { useId } from "react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import type { CommandEntry, CommandItem, CommandSection } from "@/registry/miseui/ui/command-score"
import { optionId, useMeasuredHeight } from "@/registry/miseui/ui/command-state"
import { cn } from "@/registry/miseui/lib/utils"

const INSTANT = { duration: 0 } as const

/** Consecutive positions become one slice, so a match never splits a surrogate pair it covers whole. */
function matchSlices(label: string, indices: readonly number[]) {
  const matched = new Set(indices)
  const slices: Array<{ text: string; hit: boolean }> = []
  for (let index = 0; index < label.length; index += 1) {
    const hit = matched.has(index)
    const last = slices[slices.length - 1]
    if (last && last.hit === hit) last.text += label[index]
    else slices.push({ text: label[index], hit })
  }
  return slices
}

/** Draws the matched letters with weight rather than colour: the eye finds them, and the row stays calm. */
function MatchedLabel({ label, indices }: { label: string; indices: readonly number[] }) {
  if (indices.length === 0) return label
  return matchSlices(label, indices).map(({ text, hit }, index) =>
    hit ? (
      <mark key={index} className="bg-transparent font-semibold text-foreground">
        {text}
      </mark>
    ) : (
      <span key={index}>{text}</span>
    ),
  )
}

function Shortcut({ keys }: { keys: readonly string[] }) {
  return (
    // No keyboard on touch, so the hint would only take room from the label.
    <span aria-hidden="true" data-slot="command-shortcut" className="ml-auto flex shrink-0 items-center gap-1 pl-2 pointer-coarse:hidden">
      {keys.map((key) => (
        <kbd key={key} className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm border bg-background px-1 font-sans text-xs text-muted-foreground">
          {key}
        </kbd>
      ))}
    </span>
  )
}

interface CommandRowProps {
  entry: CommandEntry
  id: string
  active: boolean
  dense: boolean
  onActive: (value: string) => void
  onPick: (item: CommandItem) => void
}

function CommandRow({ entry, id, active, dense, onActive, onPick }: CommandRowProps) {
  const { item, indices } = entry
  return (
    <div
      id={id}
      role="option"
      aria-selected={active}
      aria-disabled={item.disabled || undefined}
      data-slot="command-item"
      data-active={active ? "true" : undefined}
      // Mouse move, not enter: when the list scrolls under a resting pointer, the active row must not jump.
      onMouseMove={() => {
        if (!item.disabled && !active) onActive(item.value)
      }}
      onClick={() => onPick(item)}
      className={cn(
        "flex cursor-default items-center gap-2 rounded-md px-2 select-none pointer-coarse:min-h-10",
        dense ? "min-h-8 text-[13px]" : "min-h-10 text-sm",
        active && "bg-accent text-accent-foreground",
        item.disabled && "pointer-events-none opacity-50",
        "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
      )}
    >
      {item.icon && !dense ? <span aria-hidden="true" className="flex shrink-0">{item.icon}</span> : null}
      <span className="min-w-0 flex-1 py-1">
        <span className="block truncate">
          <MatchedLabel label={item.label} indices={indices} />
        </span>
        {item.description && !dense ? (
          <span data-slot="command-description" className="block truncate text-[13px] leading-5 text-muted-foreground">
            {item.description}
          </span>
        ) : null}
      </span>
      {item.shortcut ? <Shortcut keys={item.shortcut} /> : null}
    </div>
  )
}

function SectionBlock({ section, dense, children }: { section: CommandSection; dense: boolean; children: React.ReactNode }) {
  const headingId = useId()
  const showHeading = section.heading && !dense
  return (
    <div role="group" aria-labelledby={showHeading ? headingId : undefined} aria-label={showHeading ? undefined : section.heading} data-slot="command-group">
      {showHeading ? (
        <div id={headingId} role="presentation" data-slot="command-heading" className="px-2 pt-2 pb-1 text-[13px] text-muted-foreground">
          {section.heading}
        </div>
      ) : null}
      {children}
    </div>
  )
}

interface CommandListProps {
  listId: string
  label: string
  sections: readonly CommandSection[]
  visible: readonly CommandItem[]
  active: CommandItem | undefined
  dense: boolean
  maxHeightClass: string
  springHeight: boolean
  emptyText: React.ReactNode
  showEmpty: boolean
  onActive: (value: string) => void
  onPick: (item: CommandItem) => void
}

function CommandList(props: CommandListProps) {
  const { listId, label, sections, visible, active, dense, maxHeightClass, springHeight, emptyText, showEmpty, onActive, onPick } = props
  const reduceMotion = useReducedMotion() ?? false
  const { height, ref } = useMeasuredHeight()
  const body = (
    <div ref={springHeight ? ref : undefined} data-slot="command-scroller" className={cn("overflow-y-auto p-1", maxHeightClass)}>
      <div id={listId} role="listbox" aria-label={label}>
        {sections.map((section) => (
          <SectionBlock key={section.key} section={section} dense={dense}>
            {section.entries.map((entry) => {
              const index = visible.indexOf(entry.item)
              return (
                <CommandRow
                  key={entry.item.value}
                  entry={entry}
                  id={optionId(listId, index)}
                  active={entry.item === active}
                  dense={dense}
                  onActive={onActive}
                  onPick={onPick}
                />
              )
            })}
          </SectionBlock>
        ))}
      </div>
      {showEmpty ? (
        <div data-slot="command-empty" className="px-2 py-6 text-center text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : null}
    </div>
  )
  if (!springHeight) return body
  return (
    <motion.div
      data-slot="command-height"
      className="overflow-hidden"
      initial={false}
      animate={{ height: height ?? "auto" }}
      transition={reduceMotion ? INSTANT : SPRING_DEFAULT}
    >
      {body}
    </motion.div>
  )
}

export { CommandList }
