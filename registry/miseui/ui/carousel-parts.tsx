import type * as React from "react"
import type { CarouselState } from "@/registry/miseui/ui/carousel-state"
import { cn } from "@/registry/miseui/lib/utils"

type CarouselVariant = "plain" | "peek" | "cards" | "thumbnails"

interface CarouselItem {
  id: string
  /** Names the slide for assistive tech and in the count. */
  label: string
  content?: React.ReactNode
  /** Fills the slide at 16:9, behind `content`. The layer `parallax` moves. */
  media?: React.ReactNode
  /** Small picture for the `thumbnails` strip. */
  thumbnail?: React.ReactNode
}

interface CarouselLabels {
  previous: string
  next: string
  pause: string
  play: string
  slide: (position: number, count: number, label: string) => string
}

/** Offsets are unitless slides; each variant's distance from the current position drives its transform. */
const STACK_STYLE = {
  "--carousel-depth": "max(0, calc(var(--carousel-index) - var(--carousel-position, 0)))",
  transform:
    "translateX(calc(var(--carousel-depth) * -100% + min(var(--carousel-depth), 2) * 16px)) scale(calc(1 - min(var(--carousel-depth), 2) * 0.04))",
  opacity: "clamp(0, calc(3 - var(--carousel-depth)), 1)",
} as React.CSSProperties

const PARALLAX_STYLE = {
  transform: "translateX(calc(clamp(-1, var(--carousel-position, 0) - var(--carousel-index), 1) * 6%))",
} as React.CSSProperties

const SLIDE_CLASS: Record<CarouselVariant, string> = {
  plain: "w-full snap-start",
  peek: "w-full snap-center",
  // Snap box stays untransformed: browsers read snap positions from the transformed box, so the frame inside does the moving.
  cards: "relative w-full snap-start",
  thumbnails: "w-full snap-start",
}

const FRAME_CLASS: Record<CarouselVariant, string> = {
  plain: "rounded-lg border bg-card",
  peek: "rounded-lg border bg-card",
  cards: "origin-right rounded-xl border bg-card shadow-sm will-change-transform",
  thumbnails: "rounded-lg border bg-card",
}

interface CarouselSlideProps {
  item: CarouselItem
  index: number
  count: number
  variant: CarouselVariant
  parallax: boolean
  labels: CarouselLabels
  state: CarouselState
}

function CarouselSlide({ item, index, count, variant, parallax, labels, state }: CarouselSlideProps) {
  const current = state.active === index
  const jumpOnPress = variant === "peek" || variant === "cards"
  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={labels.slide(index + 1, count, item.label)}
      data-slot="carousel-slide"
      data-active={current ? "true" : undefined}
      style={{ "--carousel-index": index, zIndex: variant === "cards" ? count - index : undefined } as React.CSSProperties}
      className={cn("min-w-0 shrink-0", SLIDE_CLASS[variant])}
      onClickCapture={(event) => {
        if (current || !jumpOnPress) return
        // A visible neighbour is a way to get there, not a live control yet.
        event.preventDefault()
        event.stopPropagation()
        state.goTo(index)
      }}
    >
      <div
        data-slot="carousel-frame"
        style={variant === "cards" ? STACK_STYLE : undefined}
        className={cn("relative h-full overflow-hidden", FRAME_CLASS[variant], item.media ? "aspect-video" : "")}
      >
        {item.media ? (
          <div data-slot="carousel-media" style={parallax ? PARALLAX_STYLE : undefined} className={cn("absolute inset-0", parallax && "-inset-x-[8%]")}>
            {item.media}
          </div>
        ) : null}
        {item.content ? <div className="relative h-full min-w-0">{item.content}</div> : null}
      </div>
    </div>
  )
}

export { CarouselSlide, type CarouselItem, type CarouselLabels, type CarouselVariant }
