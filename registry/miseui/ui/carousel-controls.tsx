import { useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import type { CarouselItem, CarouselLabels, CarouselVariant } from "@/registry/miseui/ui/carousel-parts"
import type { CarouselState } from "@/registry/miseui/ui/carousel-state"
import { cn } from "@/registry/miseui/lib/utils"

const BUTTON_CLASS = cn(
  "flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none pointer-coarse:size-10",
  "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent hover:text-foreground",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-40 [&_svg]:size-4",
)
const OVERLAY_BUTTON_CLASS = "material absolute top-1/2 z-10 size-10 -translate-y-1/2 rounded-full border text-foreground shadow-sm hover:bg-background"

interface StepButtonProps {
  amount: 1 | -1
  label: string
  state: CarouselState
  className?: string
}

/** aria-disabled, not disabled: a focused button that went dead would drop the keyboard user back at the top of the page. */
function StepButton({ amount, label, state, className }: StepButtonProps) {
  const Icon = amount < 0 ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={!state.canStep(amount) || undefined}
      data-slot={amount < 0 ? "carousel-previous" : "carousel-next"}
      className={cn(BUTTON_CLASS, className)}
      onClick={() => state.step(amount)}
    >
      <Icon aria-hidden="true" />
    </button>
  )
}

function AutoplayButton({ state, labels }: { state: CarouselState; labels: CarouselLabels }) {
  const Icon = state.stopped ? Play : Pause
  return (
    <button
      type="button"
      data-slot="carousel-autoplay"
      aria-label={state.stopped ? labels.play : labels.pause}
      className={BUTTON_CLASS}
      onClick={() => state.setStopped(!state.stopped)}
    >
      <Icon aria-hidden="true" />
    </button>
  )
}

interface CarouselThumbsProps {
  items: readonly CarouselItem[]
  state: CarouselState
}

function CarouselThumbs({ items, state }: CarouselThumbsProps) {
  const stripRef = useRef<HTMLUListElement>(null)
  const { active, goTo } = state
  useEffect(() => {
    const strip = stripRef.current
    const thumb = strip?.querySelector<HTMLElement>("[aria-current='true']")
    if (!strip || !thumb) return
    // Not scrollIntoView, which would also scroll the page while autoplay runs off screen.
    strip.scrollTo({ left: thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2 })
  }, [active])
  return (
    <ul ref={stripRef} data-slot="carousel-thumbs" className="relative flex min-w-0 flex-1 gap-2 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item, index) => {
        const current = active === index
        return (
          <li key={item.id} className="shrink-0">
            <button
              type="button"
              aria-label={item.label}
              aria-current={current ? "true" : undefined}
              className={cn(
                "relative block size-12 overflow-hidden rounded-md border bg-muted text-[13px] tabular-nums outline-none",
                "transition-opacity duration-(--duration-fast) ease-(--ease-mise) focus-visible:ring-[3px] focus-visible:ring-ring/50",
                current ? "ring-2 ring-foreground" : "opacity-70 hover:opacity-100",
              )}
              onClick={() => goTo(index)}
            >
              {item.thumbnail ?? index + 1}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

interface CarouselControlsProps {
  variant: CarouselVariant
  items: readonly CarouselItem[]
  state: CarouselState
  labels: CarouselLabels
  autoplay: boolean
}

function CarouselControls({ variant, items, state, labels, autoplay }: CarouselControlsProps) {
  const previous = <StepButton amount={-1} label={labels.previous} state={state} />
  const next = <StepButton amount={1} label={labels.next} state={state} />
  const pause = autoplay ? <AutoplayButton state={state} labels={labels} /> : null
  const count = (
    <span data-slot="carousel-count" className="text-[13px] text-muted-foreground tabular-nums">
      {state.active + 1} / {items.length}
    </span>
  )
  if (variant === "thumbnails") {
    return <div className="flex items-center gap-1">{previous}<CarouselThumbs items={items} state={state} />{next}{pause}</div>
  }
  if (variant === "peek") return pause ? <div className="flex justify-end">{pause}</div> : null
  if (variant === "cards") {
    return <div className="flex items-center justify-center gap-2">{previous}{count}{next}{pause}</div>
  }
  return (
    <div className="flex items-center gap-2">
      <span className="mr-auto min-w-0 text-[13px] break-words text-muted-foreground">{items[state.active]?.label}</span>
      {count}
      <span className="flex">{previous}{next}{pause}</span>
    </div>
  )
}

/** Laid over the slides, because in `peek` the neighbours already show there is more and a control row would add weight. */
function CarouselOverlayButtons({ state, labels }: { state: CarouselState; labels: CarouselLabels }) {
  return (
    <>
      <StepButton amount={-1} label={labels.previous} state={state} className={cn(OVERLAY_BUTTON_CLASS, "left-2")} />
      <StepButton amount={1} label={labels.next} state={state} className={cn(OVERLAY_BUTTON_CLASS, "right-2")} />
    </>
  )
}

export { CarouselControls, CarouselOverlayButtons }
