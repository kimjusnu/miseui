import type * as React from "react"
import { useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion, useTransform, type MotionValue } from "motion/react"
import { overallProgress, sectionNumber, sectionStatus, type SectionIndexItem, type SectionStatus } from "@/registry/miseui/ui/section-index-math"
import { cn } from "@/registry/miseui/lib/utils"

interface ViewProps {
  items: readonly SectionIndexItem[]
  current: number
  progress: MotionValue<number>
  /** Fill the current section by how far it has been read, not all at once. */
  live: boolean
  onSelect: (index: number) => void
}

const LINK_CLASS =
  "relative rounded-sm text-[13px] leading-5 outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"

const STATUS_TEXT: Record<SectionStatus, string> = {
  current: "font-medium text-foreground",
  done: "text-foreground/70",
  ahead: "text-muted-foreground",
}

interface FillProps {
  status: SectionStatus
  progress: MotionValue<number>
  live: boolean
  axis: "x" | "y"
  className: string
}

/** Finished sections stay filled, which is the whole difference from a marker: the index shows how much is behind you. */
function Fill({ status, progress, live, axis, className }: FillProps) {
  if (status === "ahead") return null
  const moving = live && status === "current"
  const base = cn("absolute origin-top-left bg-mise rtl:origin-top-right", className)
  if (!moving) return <span aria-hidden="true" data-slot="section-index-fill" className={base} />
  return <motion.span aria-hidden="true" data-slot="section-index-fill" data-live="true" className={base} style={axis === "x" ? { scaleX: progress } : { scaleY: progress }} />
}

function linkProps(item: SectionIndexItem, index: number, current: number, onSelect: (index: number) => void) {
  return {
    href: `#${item.id}`,
    "aria-current": index === current ? ("location" as const) : undefined,
    "data-status": sectionStatus(index, current),
    onClick: (event: React.MouseEvent) => {
      // A modified click means a new tab or window, which the browser should handle.
      if (event.metaKey || event.ctrlKey || event.shiftKey) return
      event.preventDefault()
      onSelect(index)
    },
  }
}

function RailView({ items, current, progress, live, onSelect }: ViewProps) {
  return (
    <ol data-slot="section-index-rail" className="grid min-w-0">
      {items.map((item, index) => {
        const status = sectionStatus(index, current)
        return (
          <li key={item.id} className="relative min-w-0 before:absolute before:inset-y-0 before:start-0 before:w-px before:bg-border">
            <Fill status={status} progress={progress} live={live} axis="y" className="inset-y-0 start-0 w-0.5" />
            <a {...linkProps(item, index, current, onSelect)} className={cn(LINK_CLASS, "grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 py-1 ps-3 pe-2 pointer-coarse:py-2.5", STATUS_TEXT[status])}>
              <span className="font-mono text-xs leading-5 tabular-nums">{sectionNumber(item, index)}</span>
              <span className="min-w-0 wrap-break-word">{item.title}</span>
            </a>
          </li>
        )
      })}
    </ol>
  )
}

function StripView({ items, current, progress, live, onSelect, reduceMotion }: ViewProps & { reduceMotion: boolean }) {
  const listRef = useRef<HTMLOListElement>(null)
  // Sideways only: scrollIntoView would also move the page, which is exactly what someone reading does not want.
  useEffect(() => {
    const list = listRef.current
    const row = list?.querySelector<HTMLElement>("[aria-current]")
    if (!list || !row) return
    list.scrollTo?.({ left: row.offsetLeft - (list.clientWidth - row.offsetWidth) / 2, behavior: reduceMotion ? "auto" : "smooth" })
  }, [current, reduceMotion])
  return (
    <ol ref={listRef} data-slot="section-index-strip" className="relative flex min-w-0 overflow-x-auto shadow-[inset_0_-1px_0_var(--border)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item, index) => {
        const status = sectionStatus(index, current)
        return (
          <li key={item.id} className="relative shrink-0">
            <a {...linkProps(item, index, current, onSelect)} className={cn(LINK_CLASS, "flex h-10 items-center gap-2 px-3 whitespace-nowrap", STATUS_TEXT[status])}>
              <span className="font-mono text-xs tabular-nums">{sectionNumber(item, index)}</span>
              {item.title}
              <Fill status={status} progress={progress} live={live} axis="x" className="inset-x-0 bottom-0 h-0.5" />
            </a>
          </li>
        )
      })}
    </ol>
  )
}

const STEP_CLASS =
  "flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 pointer-coarse:size-10"

interface CounterProps extends ViewProps {
  previousLabel: string
  nextLabel: string
}

function CounterView({ items, current, progress, live, onSelect, previousLabel, nextLabel }: CounterProps) {
  const shown = Math.max(current, 0)
  const item = items[shown]
  const overall = useTransform(progress, (within) => overallProgress(current, live ? within : 1, items.length))
  if (!item) return null
  return (
    <div data-slot="section-index-counter" className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <p className="flex min-w-0 flex-1 items-baseline gap-2 text-[13px] leading-5">
          <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
            {sectionNumber(item, shown)} / {String(items.length).padStart(2, "0")}
          </span>
          <a {...linkProps(item, shown, current, onSelect)} className={cn(LINK_CLASS, "min-w-0 font-medium wrap-break-word text-foreground")}>
            {item.title}
          </a>
        </p>
        <button type="button" aria-label={previousLabel} disabled={current <= 0} className={STEP_CLASS} onClick={() => onSelect(current - 1)}>
          <ChevronLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
        </button>
        <button type="button" aria-label={nextLabel} disabled={current >= items.length - 1} className={STEP_CLASS} onClick={() => onSelect(current + 1)}>
          <ChevronRight aria-hidden="true" className="size-4 rtl:rotate-180" />
        </button>
      </div>
      <span aria-hidden="true" className="relative block h-0.5 overflow-hidden rounded-full bg-border">
        <motion.span data-slot="section-index-overall" className="absolute inset-0 origin-left bg-mise rtl:origin-right" style={{ scaleX: overall }} />
      </span>
    </div>
  )
}

export { CounterView, RailView, StripView }
