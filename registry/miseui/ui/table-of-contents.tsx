import type * as React from "react"
import { useMemo, useRef, useState } from "react"
import { List } from "lucide-react"
import { useReducedMotion } from "motion/react"
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/miseui/ui/popover"
import { TocList, type TableOfContentsVariant } from "@/registry/miseui/ui/table-of-contents-list"
import type { TocItem } from "@/registry/miseui/ui/table-of-contents-math"
import { useActiveHeading, useHeadings } from "@/registry/miseui/ui/table-of-contents-state"
import { cn } from "@/registry/miseui/lib/utils"

type TableOfContentsEffect = "spring"

const ROOT_CLASS: Record<TableOfContentsVariant, string> = {
  line: "min-w-0",
  plain: "min-w-0",
  dots: "min-w-0",
  floating: "z-40 min-w-0 max-sm:fixed max-sm:right-4 max-sm:bottom-[calc(1rem+env(safe-area-inset-bottom))] max-sm:max-w-[calc(100%-2rem)] sm:sticky sm:top-4",
}

interface CollapsedProps {
  label: string
  items: readonly TocItem[]
  active: string | null
  spring: boolean
  onSelect: (id: string) => void
}

/** On a phone the list would cover the article, so it folds into a button that still says where you are. */
function CollapsedToc({ label, items, active, spring, onSelect }: CollapsedProps) {
  const [open, setOpen] = useState(false)
  const jumpedRef = useRef(false)
  const current = items.find((item) => item.id === active)?.title
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        data-slot="toc-trigger"
        aria-label={current ? `${label}: ${current}` : label}
        className="flex h-10 max-w-full items-center gap-2 rounded-full border bg-popover px-4 text-sm font-medium text-popover-foreground shadow-lg outline-none transition-[scale] duration-(--duration-fast) ease-(--ease-mise) focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.97] active:duration-0 motion-reduce:active:scale-100 sm:hidden"
      >
        <List aria-hidden="true" className="size-4 shrink-0" />
        <span className="min-w-0 truncate">{current ?? label}</span>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="max-h-[60dvh] w-64 max-w-(--radix-popover-content-available-width) overflow-y-auto p-2"
        // The jump already moved focus to the heading; handing it back to this button would undo that.
        onCloseAutoFocus={(event) => {
          if (jumpedRef.current) event.preventDefault()
          jumpedRef.current = false
        }}
      >
        <TocList
          items={items}
          variant="floating"
          active={active}
          spring={spring}
          onSelect={(id) => {
            jumpedRef.current = true
            onSelect(id)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

type TableOfContentsProps = Omit<React.ComponentProps<"nav">, "title"> & {
  /** The sections, if you already have them. */
  items?: readonly TocItem[]
  /** Or read the headings from this element, and follow it as its content changes. Missing ids are added. */
  containerRef?: React.RefObject<HTMLElement | null>
  /** Which headings to read from the container. */
  selector?: string
  /** The element that scrolls, when it is not the page. */
  scrollRef?: React.RefObject<HTMLElement | null>
  /** Space kept above a heading after a jump, such as a sticky header's height, in px. */
  scrollOffset?: number
  /** `line` a rail with a marker, `plain` text only, `dots` small outline numbers, `floating` a card that folds into a button on phones. */
  variant?: TableOfContentsVariant
  /** `spring` slides one marker between the rows. */
  effect?: TableOfContentsEffect
  /** Name of the landmark, and the button text on phones when no section is current. */
  label?: string
  /** A visible heading above the list. */
  title?: React.ReactNode
  /** Called after a jump, for example to write the hash into the address. */
  onNavigate?: (id: string) => void
}

function TableOfContents({
  items,
  containerRef,
  selector = "h2, h3",
  scrollRef,
  scrollOffset = 16,
  variant = "line",
  effect,
  label = "On this page",
  title,
  onNavigate,
  className,
  ...props
}: TableOfContentsProps) {
  const reduceMotion = useReducedMotion() ?? false
  const headings = useHeadings(items, containerRef, selector)
  const ids = useMemo(() => headings.map((heading) => heading.id), [headings])
  const { active, goTo } = useActiveHeading(ids, { scrollRef, offset: scrollOffset, reduceMotion })
  const spring = effect === "spring" && !reduceMotion
  if (headings.length === 0) return null
  const onSelect = (id: string) => {
    goTo(id)
    onNavigate?.(id)
  }
  const floating = variant === "floating"
  const heading = title ? <p data-slot="toc-title" className="mb-2 text-[13px] leading-5 font-medium text-foreground">{title}</p> : null
  const list = <TocList items={headings} variant={variant} active={active} spring={spring} onSelect={onSelect} />
  return (
    <nav aria-label={label} data-slot="table-of-contents" data-variant={variant} data-effect={effect} className={cn(ROOT_CLASS[variant], className)} {...props}>
      {floating ? (
        <>
          <div data-slot="toc-card" className="rounded-lg border bg-popover p-2 text-popover-foreground shadow-sm max-sm:hidden">
            {heading}
            {list}
          </div>
          <CollapsedToc label={label} items={headings} active={active} spring={spring} onSelect={onSelect} />
        </>
      ) : (
        <>
          {heading}
          {list}
        </>
      )}
    </nav>
  )
}

export { TableOfContents, type TableOfContentsProps, type TableOfContentsVariant, type TableOfContentsEffect, type TocItem }
