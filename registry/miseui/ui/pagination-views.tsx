import { motion } from "motion/react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { getDotWindow, getPageWindow, type PageSlot } from "@/registry/miseui/ui/pagination-window"
import { cn } from "@/registry/miseui/lib/utils"

const CONTROL_CLASS = [
  "relative inline-flex shrink-0 items-center justify-center rounded-md text-sm font-medium tabular-nums outline-none",
  "transition-[color,background-color,scale] duration-(--duration-fast) ease-(--ease-mise) active:scale-[0.97] active:duration-100",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 motion-reduce:active:scale-100",
].join(" ")
/** 40 px under a finger, tighter where there is a mouse. */
const SQUARE_CLASS = "size-10 pointer-fine:size-9"

export interface PageViewProps {
  page: number
  pageCount: number
  goTo: (page: number) => void
  /** `slide` travels between pages through a shared layoutId; `static` just appears on the active one. */
  indicator: "slide" | "static"
}

function ActiveFill({ indicator, className }: { indicator: PageViewProps["indicator"]; className: string }) {
  return (
    <motion.span
      aria-hidden="true"
      data-slot="pagination-indicator"
      layoutId={indicator === "slide" ? "pagination-indicator" : undefined}
      transition={SPRING_DEFAULT}
      className={cn("absolute", className)}
    />
  )
}

function StepButton({ direction, page, pageCount, goTo }: { direction: "previous" | "next" } & PageViewProps) {
  const isNext = direction === "next"
  const Icon = isNext ? ChevronRight : ChevronLeft
  return (
    <button
      type="button"
      aria-label={isNext ? "Next page" : "Previous page"}
      disabled={isNext ? page >= pageCount : page <= 1}
      onClick={() => goTo(isNext ? page + 1 : page - 1)}
      className={cn(CONTROL_CLASS, SQUARE_CLASS, "text-foreground hover:bg-accent")}
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  )
}

function NumberCell({ slot, page, goTo, indicator }: { slot: PageSlot } & Omit<PageViewProps, "pageCount">) {
  if (typeof slot !== "number") {
    return (
      <li
        aria-hidden="true"
        className={cn("inline-flex items-center justify-center text-sm text-muted-foreground", SQUARE_CLASS)}
      >
        …
      </li>
    )
  }
  const isActive = slot === page
  return (
    <li>
      <button
        type="button"
        aria-label={`Page ${slot}`}
        aria-current={isActive ? "page" : undefined}
        onClick={() => goTo(slot)}
        className={cn(CONTROL_CLASS, SQUARE_CLASS, isActive ? "text-mise-foreground" : "text-foreground hover:bg-accent")}
      >
        {isActive && <ActiveFill indicator={indicator} className="inset-0 -z-10 rounded-md bg-mise" />}
        {slot}
      </button>
    </li>
  )
}

export function NumbersView({ siblings, boundaries, ...view }: PageViewProps & { siblings?: number; boundaries?: number }) {
  const slots = getPageWindow({ page: view.page, pageCount: view.pageCount, siblings, boundaries })
  return (
    <div className="isolate flex flex-wrap items-center justify-center gap-1">
      <StepButton direction="previous" {...view} />
      <ol className="contents">
        {slots.map((slot) => (
          <NumberCell key={slot} slot={slot} page={view.page} goTo={view.goTo} indicator={view.indicator} />
        ))}
      </ol>
      <StepButton direction="next" {...view} />
    </div>
  )
}

export function SimpleView(view: PageViewProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <StepButton direction="previous" {...view} />
      <p aria-live="polite" className="text-sm text-muted-foreground tabular-nums">
        Page <span className="font-medium text-foreground">{view.page}</span> of {Math.max(1, view.pageCount)}
      </p>
      <StepButton direction="next" {...view} />
    </div>
  )
}

export function DotsView({ page, pageCount, goTo, indicator }: PageViewProps) {
  return (
    <ol className="isolate flex flex-wrap items-center justify-center">
      {getDotWindow(page, pageCount).map((dot) => {
        const isActive = dot === page
        return (
          <li key={dot}>
            <button
              type="button"
              aria-label={`Page ${dot}`}
              aria-current={isActive ? "page" : undefined}
              onClick={() => goTo(dot)}
              className={cn(CONTROL_CLASS, "size-10 pointer-fine:size-6")}
            >
              <span className="size-2 rounded-full bg-muted-foreground/30" />
              {isActive && <ActiveFill indicator={indicator} className="h-2 w-4 rounded-full bg-foreground" />}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

interface LoadMoreProps extends Omit<PageViewProps, "indicator"> {
  itemCount: number
  pageSize: number
  loading: boolean
}

export function LoadMoreView({ page, pageCount, goTo, itemCount, pageSize, loading }: LoadMoreProps) {
  const shown = Math.min(page * pageSize, itemCount)
  const isDone = page >= pageCount
  const share = itemCount > 0 ? (shown / itemCount) * 100 : 0
  return (
    <div className="grid justify-items-center gap-3">
      <p aria-live="polite" className="text-sm text-muted-foreground tabular-nums">
        Showing <span className="font-medium text-foreground">{shown}</span> of {itemCount}
      </p>
      <span aria-hidden="true" className="h-0.5 w-40 max-w-full overflow-hidden rounded-full bg-muted">
        <span
          data-slot="pagination-meter"
          className="block h-full rounded-full bg-mise transition-[width] duration-(--duration-base) ease-(--ease-mise) motion-reduce:transition-none"
          style={{ width: `${share}%` }}
        />
      </span>
      <button
        type="button"
        disabled={isDone || loading}
        aria-busy={loading || undefined}
        onClick={() => goTo(page + 1)}
        className={cn(CONTROL_CLASS, "h-10 border border-border bg-background px-4 text-foreground hover:bg-accent")}
      >
        {isDone ? "All loaded" : loading ? "Loading" : "Load more"}
      </button>
    </div>
  )
}
