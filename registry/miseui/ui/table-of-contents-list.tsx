import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { depths, outlineNumbers, type TocItem } from "@/registry/miseui/ui/table-of-contents-math"
import { cn } from "@/registry/miseui/lib/utils"

type TableOfContentsVariant = "line" | "plain" | "dots" | "floating"

const ROW_CLASS: Record<TableOfContentsVariant, string> = {
  line: "py-1 pr-2",
  plain: "rounded-md py-1 pr-2",
  dots: "flex items-start gap-2 py-1 pr-2",
  floating: "rounded-md py-1 pr-2",
}

const DEPTH_CLASS: Record<TableOfContentsVariant, readonly string[]> = {
  line: ["pl-3", "pl-6", "pl-9"],
  plain: ["pl-2", "pl-6", "pl-10"],
  dots: ["pl-0", "pl-4", "pl-8"],
  floating: ["pl-2", "pl-6", "pl-10"],
}

const MARKER_CLASS: Record<TableOfContentsVariant, string> = {
  line: "-left-px w-0.5 bg-mise",
  plain: "-z-10 rounded-md bg-accent",
  dots: "-z-10 rounded-sm bg-mise",
  floating: "-z-10 rounded-md bg-accent",
}

const STATIC_MARKER_FIT: Record<TableOfContentsVariant, string> = {
  line: "inset-y-0",
  plain: "inset-0",
  dots: "inset-0",
  floating: "inset-0",
}

interface MarkerBox {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Offsets, not rects: a rect taken while a popover zooms in comes out scaled, and the marker would stay wrong until
 * the next change. A layoutId is no use either, as the list usually sits in a sticky column and it would chase the page.
 */
function measureMarker(list: HTMLElement): MarkerBox | null {
  const row = list.querySelector<HTMLElement>("[aria-current]")
  if (!row) return null
  const mark = row.querySelector<HTMLElement>("[data-slot='toc-mark']")
  const target = mark ?? row
  return {
    x: row.offsetLeft + (mark?.offsetLeft ?? 0),
    y: row.offsetTop + (mark?.offsetTop ?? 0),
    width: target.offsetWidth,
    height: target.offsetHeight,
  }
}

function useMarkerBox(listRef: React.RefObject<HTMLUListElement | null>, active: string | null, enabled: boolean) {
  const [box, setBox] = useState<MarkerBox | null>(null)
  useEffect(() => {
    const list = listRef.current
    if (!enabled || !list || !active) return
    // Fires once on observe, so a change of the active row and a resize take the same path.
    const observer = new ResizeObserver(() => setBox(measureMarker(list)))
    observer.observe(list)
    return () => observer.disconnect()
  }, [listRef, active, enabled])
  return box
}

function SpringMarker({ variant, box }: { variant: TableOfContentsVariant; box: MarkerBox }) {
  // `line` keeps its rail position and width from the class and only travels along it.
  const line = variant === "line"
  return (
    <motion.span
      aria-hidden="true"
      data-slot="toc-marker"
      className={cn("pointer-events-none absolute top-0", !line && "left-0", MARKER_CLASS[variant])}
      initial={false}
      animate={line ? { y: box.y, height: box.height } : { x: box.x, y: box.y, width: box.width, height: box.height }}
      transition={SPRING_DEFAULT}
    />
  )
}

function StaticMarker({ variant }: { variant: TableOfContentsVariant }) {
  return <span aria-hidden="true" data-slot="toc-marker" className={cn("pointer-events-none absolute", MARKER_CLASS[variant], STATIC_MARKER_FIT[variant])} />
}

interface TocRowProps {
  item: TocItem
  variant: TableOfContentsVariant
  number: string
  depth: number
  current: boolean
  /** A marker of its own in the row; with the spring one marker travels at list level. */
  showMarker: boolean
  onSelect: (id: string) => void
}

function TocRow({ item, variant, number, depth, current, showMarker, onSelect }: TocRowProps) {
  const dots = variant === "dots"
  return (
    <li className="min-w-0">
      <a
        href={`#${item.id}`}
        aria-current={current ? "location" : undefined}
        onClick={(event) => {
          // A modified click means a new tab or window, which the browser should handle.
          if (event.metaKey || event.ctrlKey || event.shiftKey) return
          event.preventDefault()
          onSelect(item.id)
        }}
        className={cn(
          "relative block rounded-sm text-[13px] leading-5 wrap-break-word outline-none",
          "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:text-foreground",
          "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset pointer-coarse:py-2.5",
          current ? "font-medium text-foreground" : "text-muted-foreground",
          ROW_CLASS[variant],
          DEPTH_CLASS[variant][depth],
        )}
      >
        {showMarker && !dots ? <StaticMarker variant={variant} /> : null}
        {dots ? (
          <span aria-hidden="true" data-slot="toc-mark" className="relative inline-flex h-5 min-w-6 shrink-0 items-center justify-center px-1 text-xs tabular-nums">
            {showMarker ? <StaticMarker variant={variant} /> : null}
            <span className={current ? "text-mise-foreground" : undefined}>{number}</span>
          </span>
        ) : null}
        <span className="min-w-0">{item.title}</span>
      </a>
    </li>
  )
}

/** `plain` has no marker at rest: the text getting darker is its whole signal. Only the spring gives it a travelling fill. */
function restsWithMarker(variant: TableOfContentsVariant) {
  return variant !== "plain"
}

interface TocListProps {
  items: readonly TocItem[]
  variant: TableOfContentsVariant
  active: string | null
  spring: boolean
  onSelect: (id: string) => void
}

function TocList({ items, variant, active, spring, onSelect }: TocListProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const box = useMarkerBox(listRef, active, spring)
  const numbers = outlineNumbers(items)
  const indents = depths(items)
  return (
    <ul ref={listRef} data-slot="toc-list" className={cn("relative isolate grid", variant === "line" && "border-l")}>
      {spring && box && active ? <SpringMarker variant={variant} box={box} /> : null}
      {items.map((item, index) => {
        const current = item.id === active
        return (
          <TocRow
            key={item.id}
            item={item}
            variant={variant}
            number={numbers[index]}
            depth={indents[index]}
            current={current}
            showMarker={current && !spring && restsWithMarker(variant)}
            onSelect={onSelect}
          />
        )
      })}
    </ul>
  )
}

export { TocList, measureMarker, type TableOfContentsVariant }
