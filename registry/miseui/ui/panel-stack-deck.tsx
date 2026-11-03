import type * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { isEditable, usePanelTrack } from "@/registry/miseui/ui/panel-stack-state"
import { cn } from "@/registry/miseui/lib/utils"

type PanelStackVariant = "deck" | "peek" | "overlay"
type PanelStackEffect = "wheel"

interface PanelStackPanel {
  /** Needed only when two panels share a title. */
  id?: string
  title: string
  /** A few words above the title. */
  kicker?: React.ReactNode
  content: React.ReactNode
}

const ROOT_CLASS: Record<PanelStackVariant, string> = {
  deck: "grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3",
  peek: "grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3",
  overlay: "grid h-dvh min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)]",
}

const HEADER_CLASS: Record<PanelStackVariant, string> = {
  deck: "flex min-w-0 items-center gap-2",
  peek: "flex min-w-0 items-center gap-2",
  overlay: "flex min-w-0 items-center gap-2 px-4 pt-4 sm:px-8 sm:pt-6",
}

/** Not rounded: a rounded clip on a sideways scroller cuts the hairlines of whatever runs off its edge. */
const TRACK_CLASS: Record<PanelStackVariant, string> = {
  deck: "",
  peek: "gap-2",
  overlay: "min-h-0",
}

const PANEL_CLASS: Record<PanelStackVariant, string> = {
  deck: "w-full border-y py-6",
  peek: "w-[85%] rounded-lg border bg-card p-4 text-card-foreground",
  overlay: "flex w-full overflow-y-auto px-4 py-8 sm:px-8",
}

const TITLE_CLASS: Record<PanelStackVariant, string> = {
  deck: "text-xl leading-7 font-semibold tracking-tight text-pretty",
  peek: "text-[15px] leading-6 font-medium text-pretty",
  overlay: "text-title text-[clamp(32px,7vw,64px)] text-pretty",
}

const BODY_CLASS: Record<PanelStackVariant, string> = {
  deck: "mt-2 text-[15px] leading-7",
  peek: "mt-1 text-[13px] leading-5 text-muted-foreground",
  overlay: "mt-6 max-w-[60ch] text-[15px] leading-7 sm:text-lg sm:leading-8",
}

const STEP_CLASS =
  "flex size-8 shrink-0 items-center justify-center rounded-md border text-foreground outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 pointer-coarse:size-10"

const INSTANT = { duration: 0 } as const

interface PanelDeckProps {
  panels: readonly PanelStackPanel[]
  variant: PanelStackVariant
  effect?: PanelStackEffect
  label: string
  previousLabel: string
  nextLabel: string
  /** Room in the header for a way out, used by the overlay. */
  leading?: React.ReactNode
  className?: string
  rootProps?: React.ComponentProps<"div">
}

function PanelProgress({ index, count }: { index: number; count: number }) {
  const reduceMotion = useReducedMotion() ?? false
  return (
    <span aria-hidden="true" className="relative block h-0.5 min-w-4 flex-1 overflow-hidden rounded-full bg-border">
      <motion.span
        data-slot="panel-stack-bar"
        className="absolute inset-0 origin-left bg-mise rtl:origin-right"
        initial={false}
        animate={{ scaleX: (index + 1) / count }}
        transition={reduceMotion ? INSTANT : SPRING_DEFAULT}
      />
    </span>
  )
}

function PanelContent({ panel, variant }: { panel: PanelStackPanel; variant: PanelStackVariant }) {
  return (
    // Auto margins and not items-center: centring a panel taller than the screen would cut off its top for good.
    <div className={cn("min-w-0", variant === "overlay" && "m-auto w-full max-w-3xl")}>
      {panel.kicker ? <p className="text-[13px] leading-5 text-muted-foreground">{panel.kicker}</p> : null}
      <h3 className={TITLE_CLASS[variant]}>{panel.title}</h3>
      <div className={BODY_CLASS[variant]}>{panel.content}</div>
    </div>
  )
}

function PanelDeck({ panels, variant, effect, label, previousLabel, nextLabel, leading, className, rootProps }: PanelDeckProps) {
  const reduceMotion = useReducedMotion() ?? false
  const { setTrack, index, goTo } = usePanelTrack(panels.length, reduceMotion, effect === "wheel")
  const current = panels[index]
  const pad = (value: number) => String(value).padStart(2, "0")
  const describe = (position: number, title: string) => `${position + 1} of ${panels.length}: ${title}`
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    rootProps?.onKeyDown?.(event)
    if (isEditable(event.target) || (event.key !== "ArrowRight" && event.key !== "ArrowLeft")) return
    const forward = (event.key === "ArrowRight") === (getComputedStyle(event.currentTarget).direction !== "rtl")
    const next = index + (forward ? 1 : -1)
    if (next < 0 || next >= panels.length) return
    event.preventDefault()
    goTo(next)
  }
  return (
    <div {...rootProps} data-slot="panel-stack" data-variant={variant} data-effect={effect} className={cn(ROOT_CLASS[variant], className)} onKeyDown={onKeyDown}>
      <div data-slot="panel-stack-header" className={HEADER_CLASS[variant]}>
        {leading}
        <p data-slot="panel-stack-count" aria-hidden="true" className="shrink-0 font-mono text-[13px] leading-5 whitespace-nowrap tabular-nums">
          {pad(index + 1)} <span className="text-muted-foreground">/ {pad(panels.length)}</span>
        </p>
        <PanelProgress index={index} count={panels.length} />
        <button type="button" aria-label={previousLabel} disabled={index <= 0} className={STEP_CLASS} onClick={() => goTo(index - 1)}>
          <ChevronLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
        </button>
        <button type="button" aria-label={nextLabel} disabled={index >= panels.length - 1} className={STEP_CLASS} onClick={() => goTo(index + 1)}>
          <ChevronRight aria-hidden="true" className="size-4 rtl:rotate-180" />
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        {current ? describe(index, current.title) : null}
      </p>
      <div
        ref={setTrack}
        role="group"
        aria-label={label}
        tabIndex={0}
        data-slot="panel-stack-track"
        className={cn(
          "relative flex min-w-0 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain outline-none [scrollbar-width:none] focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset [&::-webkit-scrollbar]:hidden",
          TRACK_CLASS[variant],
        )}
      >
        {panels.map((panel, position) => (
          <section key={panel.id ?? panel.title} aria-label={describe(position, panel.title)} data-slot="panel-stack-panel" className={cn("min-w-0 shrink-0 snap-start", PANEL_CLASS[variant])}>
            <PanelContent panel={panel} variant={variant} />
          </section>
        ))}
      </div>
    </div>
  )
}

export { PanelDeck, type PanelDeckProps, type PanelStackEffect, type PanelStackPanel, type PanelStackVariant }
