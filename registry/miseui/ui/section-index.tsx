import type * as React from "react"
import { useReducedMotion } from "motion/react"
import { useSectionIndex } from "@/registry/miseui/ui/section-index-state"
import { CounterView, RailView, StripView } from "@/registry/miseui/ui/section-index-views"
import type { SectionIndexItem } from "@/registry/miseui/ui/section-index-math"
import { cn } from "@/registry/miseui/lib/utils"

type SectionIndexVariant = "rail" | "strip" | "counter"
type SectionIndexEffect = "progress"

type SectionIndexProps = React.ComponentProps<"nav"> & {
  /** The chapters, in page order. Each `id` belongs to a whole section, not to its heading. */
  items: readonly SectionIndexItem[]
  /** `rail` numbered rows that fill as you read, `strip` one scrolling line for a sticky bar, `counter` where you are out of how many. */
  variant?: SectionIndexVariant
  /** `progress` fills the current section by how far it has been read, not all at once. */
  effect?: SectionIndexEffect
  /** The element that scrolls, when it is not the page. */
  scrollRef?: React.RefObject<HTMLElement | null>
  /** Space kept above a section after a jump, such as a sticky header's height, in px. */
  scrollOffset?: number
  /** Name of the landmark. */
  label?: string
  previousLabel?: string
  nextLabel?: string
  /** Called after a jump, for example to write the hash into the address. */
  onNavigate?: (id: string) => void
}

function SectionIndex({
  items,
  variant = "rail",
  effect,
  scrollRef,
  scrollOffset = 16,
  label = "Sections",
  previousLabel = "Previous section",
  nextLabel = "Next section",
  onNavigate,
  className,
  ...props
}: SectionIndexProps) {
  const reduceMotion = useReducedMotion() ?? false
  const { current, progress, goTo } = useSectionIndex(items, { scrollRef, scrollOffset, reduceMotion })
  if (items.length === 0) return null
  const onSelect = (index: number) => {
    goTo(index)
    const id = items[index]?.id
    if (id) onNavigate?.(id)
  }
  const view = { items, current, progress, live: effect === "progress", onSelect }
  return (
    <nav aria-label={label} data-slot="section-index" data-variant={variant} data-effect={effect} className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)]", className)} {...props}>
      {variant === "rail" ? <RailView {...view} /> : null}
      {variant === "strip" ? <StripView {...view} reduceMotion={reduceMotion} /> : null}
      {variant === "counter" ? <CounterView {...view} previousLabel={previousLabel} nextLabel={nextLabel} /> : null}
    </nav>
  )
}

export { SectionIndex, type SectionIndexProps, type SectionIndexVariant, type SectionIndexEffect, type SectionIndexItem }
