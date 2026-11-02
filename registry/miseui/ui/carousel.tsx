import type * as React from "react"
import { useRef } from "react"
import { useReducedMotion } from "motion/react"
import { CarouselControls, CarouselOverlayButtons } from "@/registry/miseui/ui/carousel-controls"
import { CarouselSlide, type CarouselItem, type CarouselLabels, type CarouselVariant } from "@/registry/miseui/ui/carousel-parts"
import { useCarouselState, type CarouselState } from "@/registry/miseui/ui/carousel-state"
import { cn } from "@/registry/miseui/lib/utils"

type CarouselEffect = "parallax"

const DEFAULT_INTERVAL_MS = 6000

const DEFAULT_LABELS: CarouselLabels = {
  previous: "Previous slide",
  next: "Next slide",
  pause: "Pause slides",
  play: "Play slides",
  slide: (position, count, label) => `${position} of ${count}: ${label}`,
}

const VIEWPORT_CLASS: Record<CarouselVariant, string> = {
  plain: "gap-4",
  peek: "gap-3 px-[8%]",
  // Room on the right for the cards waiting behind the current one.
  cards: "pr-12",
  thumbnails: "gap-4",
}

type RootAttributes = Omit<React.ComponentProps<"div">, "children" | "onKeyDown">

interface CarouselProps extends RootAttributes {
  /** What this carousel holds, read out when someone enters it. */
  label: string
  items: readonly CarouselItem[]
  /** `plain` one slide with a count, `peek` neighbours visible, `cards` a stacked deck, `thumbnails` a picture strip. */
  variant?: CarouselVariant
  /** `parallax` moves `media` slightly against the swipe. Ignored by `cards`, which already moves in depth. */
  effect?: CarouselEffect
  index?: number
  defaultIndex?: number
  onIndexChange?: (index: number) => void
  /** Wraps past the ends with the buttons and arrow keys. Swiping stops at the ends either way. */
  loop?: boolean
  /** Off by default. When on it pauses on hover and focus, offers a pause button and never runs under reduced motion. */
  autoplay?: boolean
  interval?: number
  labels?: Partial<CarouselLabels>
}

interface CarouselViewportProps {
  viewportRef: React.RefObject<HTMLDivElement | null>
  label: string
  items: readonly CarouselItem[]
  variant: CarouselVariant
  parallax: boolean
  labels: CarouselLabels
  state: CarouselState
}

function CarouselViewport({ viewportRef, label, items, variant, parallax, labels, state }: CarouselViewportProps) {
  return (
    <div
      ref={viewportRef}
      tabIndex={0}
      data-slot="carousel-viewport"
      aria-label={label}
      role="group"
      className={cn(
        "relative flex min-w-0 snap-x snap-mandatory overflow-x-auto overscroll-x-contain outline-none",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:ring-[3px] focus-visible:ring-ring/50",
        VIEWPORT_CLASS[variant],
      )}
      onScroll={state.onScroll}
      onScrollEnd={state.onScrollEnd}
      onPointerDown={state.release}
      onWheel={state.release}
    >
      {items.map((item, position) => (
        <CarouselSlide key={item.id} item={item} index={position} count={items.length} variant={variant} parallax={parallax} labels={labels} state={state} />
      ))}
    </div>
  )
}

function Carousel({
  label, items, variant = "plain", effect, index, defaultIndex = 0, onIndexChange, loop = false,
  autoplay = false, interval = DEFAULT_INTERVAL_MS, labels, className, ...props
}: CarouselProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion() ?? false
  const merged = { ...DEFAULT_LABELS, ...labels }
  const align = variant === "peek" ? "center" : "start"
  const state = useCarouselState(
    { count: items.length, align, loop, autoplay, interval, index, defaultIndex, onIndexChange, reduceMotion },
    { rootRef, viewportRef },
  )
  const current = items[state.active]
  const parallax = effect === "parallax" && variant !== "cards" && !reduceMotion
  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      data-slot="carousel"
      data-variant={variant}
      data-effect={effect}
      className={cn("grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-3", className)}
      onKeyDown={state.onKeyDown}
      onPointerEnter={() => state.setHovered(true)}
      onPointerLeave={() => state.setHovered(false)}
      // Otherwise pressing Play would leave focus on Play, and focus inside holds the slides still.
      onFocusCapture={(event) => state.setFocused((event.target as HTMLElement).closest("[data-slot='carousel-autoplay']") === null)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) state.setFocused(false)
      }}
      {...props}
    >
      <div className="relative min-w-0">
        <CarouselViewport viewportRef={viewportRef} label={label} items={items} variant={variant} parallax={parallax} labels={merged} state={state} />
        {variant === "peek" ? <CarouselOverlayButtons state={state} labels={merged} /> : null}
      </div>
      <CarouselControls variant={variant} items={items} state={state} labels={merged} autoplay={autoplay} />
      <p className="sr-only" aria-live={state.running ? "off" : "polite"} aria-atomic="true">
        {current ? merged.slide(state.active + 1, items.length, current.label) : ""}
      </p>
    </div>
  )
}

export { Carousel, type CarouselProps, type CarouselItem, type CarouselVariant, type CarouselEffect, type CarouselLabels }
