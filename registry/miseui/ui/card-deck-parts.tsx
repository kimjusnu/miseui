import type * as React from "react"
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"
import type { DeckState } from "@/registry/miseui/ui/card-deck-state"
import { cn } from "@/registry/miseui/lib/utils"

export interface CardDeckStat {
  label: string
  value: string
}

export interface CardDeckSlide {
  id: string
  title: string
  /** A short line above the title, such as a section name. */
  kicker?: string
  body?: React.ReactNode
  /** Up to three figures; the label is read first and the value is seen first. */
  stats?: readonly CardDeckStat[]
  media?: React.ReactNode
}

export interface CardDeckLabels {
  previous: string
  next: string
  restart: string
  slide: (position: number, count: number, title: string) => string
}

export const DEFAULT_LABELS: CardDeckLabels = {
  previous: "Previous slide",
  next: "Next slide",
  restart: "Start over",
  slide: (position, count, title) => `Slide ${position} of ${count}: ${title}`,
}

interface FaceProps {
  slide: CardDeckSlide
  /** `inverted` sits on the foreground colour, where the muted token would lose contrast. */
  tone?: "plain" | "inverted"
  large?: boolean
}

function DeckStats({ stats, quiet }: { stats: readonly CardDeckStat[]; quiet: string }) {
  return (
    <dl className="grid grid-cols-[repeat(auto-fit,minmax(5rem,1fr))] gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex min-w-0 flex-col-reverse gap-1">
          <dt className={cn("text-[13px]", quiet)}>{stat.label}</dt>
          <dd className="text-xl font-semibold tracking-tight tabular-nums">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function DeckFace({ slide, tone = "plain", large = false }: FaceProps) {
  const quiet = tone === "inverted" ? "text-background/70" : "text-muted-foreground"
  return (
    <div data-slot="card-deck-face" className="flex h-full min-h-56 min-w-0 flex-col justify-between gap-6 p-6">
      {slide.kicker ? <p className={cn("text-[13px]", quiet)}>{slide.kicker}</p> : <span />}
      {slide.media ? <div className="overflow-hidden rounded-lg">{slide.media}</div> : null}
      <div className="grid min-w-0 gap-2">
        <h3 className={cn("font-semibold tracking-tight text-balance", large ? "text-2xl" : "text-xl")}>{slide.title}</h3>
        {slide.body ? <div className={cn("text-sm leading-relaxed", quiet)}>{slide.body}</div> : null}
        {slide.stats?.length ? (
          <div className="pt-2">
            <DeckStats stats={slide.stats} quiet={quiet} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

const ICON_BUTTON_CLASS = [
  "inline-grid size-10 shrink-0 place-items-center rounded-full border bg-background text-foreground outline-none",
  "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-muted",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:bg-background",
]

type DeckButtonProps = Omit<React.ComponentProps<"button">, "disabled"> & { inactive?: boolean }

/** aria-disabled rather than disabled: a button that disables itself under the finger would drop keyboard focus to the page. */
export function DeckButton({ inactive = false, onClick, className, ...props }: DeckButtonProps) {
  return (
    <button
      type="button"
      aria-disabled={inactive || undefined}
      onClick={inactive ? undefined : onClick}
      className={cn(ICON_BUTTON_CLASS, className)}
      {...props}
    />
  )
}

interface ControlsProps {
  deck: DeckState
  labels: CardDeckLabels
  rewindable: boolean
}

export function DeckRestart({ deck, labels, className }: { deck: DeckState; labels: CardDeckLabels; className?: string }) {
  return (
    <button
      type="button"
      data-slot="card-deck-restart"
      aria-disabled={deck.active === 0 || undefined}
      onClick={deck.active === 0 ? undefined : deck.rewind}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full px-3 text-[13px] font-medium outline-none",
        "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-muted",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:bg-transparent",
        className,
      )}
    >
      <RotateCcw aria-hidden="true" className="size-4" />
      {labels.restart}
    </button>
  )
}

export function DeckControls({ deck, labels, rewindable }: ControlsProps) {
  return (
    <div data-slot="card-deck-controls" className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <DeckButton aria-label={labels.previous} inactive={deck.active === 0} onClick={() => deck.go(deck.active - 1)}>
          <ChevronLeft aria-hidden="true" className="size-4" />
        </DeckButton>
        <DeckButton aria-label={labels.next} inactive={deck.active === deck.last} onClick={() => deck.go(deck.active + 1)}>
          <ChevronRight aria-hidden="true" className="size-4" />
        </DeckButton>
        <span aria-hidden="true" className="pl-2 text-[13px] text-muted-foreground tabular-nums">
          {deck.active + 1} / {deck.count}
        </span>
      </div>
      {rewindable ? <DeckRestart deck={deck} labels={labels} /> : null}
    </div>
  )
}
