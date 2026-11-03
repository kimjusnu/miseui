import { motion, useTransform } from "motion/react"
import { DeckButton, DeckFace, DeckRestart, type CardDeckLabels, type CardDeckSlide } from "@/registry/miseui/ui/card-deck-parts"
import type { DeckState, DeckSwipe } from "@/registry/miseui/ui/card-deck-state"
import { cn } from "@/registry/miseui/lib/utils"

export interface StageProps {
  slides: readonly CardDeckSlide[]
  deck: DeckState
  swipe: DeckSwipe
  labels: CardDeckLabels
  rewindable: boolean
}

const STACK_DEPTH = 2
const STACK_STEP_PX = 12
const STACK_SHRINK = 0.04
const DRAG_TILT_DEG = 4
const DRAG_TILT_RANGE_PX = 240

/** One pose per place in the pile: gone to the left, on top, or waiting behind with its bottom edge showing. */
export function stackPose(position: number) {
  if (position < 0) return { x: "-112%", y: 0, scale: 1, rotate: -6, opacity: 0 }
  const depth = Math.min(position, STACK_DEPTH + 1)
  return {
    x: "0%",
    y: depth * STACK_STEP_PX,
    scale: 1 - depth * STACK_SHRINK,
    rotate: 0,
    opacity: position > STACK_DEPTH ? 0 : 1,
  }
}

const SURFACE_CLASS = "rounded-xl border bg-card text-card-foreground shadow-[0_8px_24px_-16px_rgb(0_0_0/0.35)]"
const GRAB_CLASS = "cursor-grab touch-pan-y select-none active:cursor-grabbing"

export function StripStage({ slides, deck, swipe }: StageProps) {
  return (
    <div
      data-slot="card-deck-stage"
      className={cn("relative min-w-0 overflow-hidden rounded-xl border bg-card text-card-foreground", GRAB_CLASS)}
      {...swipe.handlers}
    >
      <motion.div style={{ x: swipe.dragX }}>
        {/* A percentage is of the strip's own width, so a resize needs no measuring and no correction. */}
        <motion.div
          data-slot="card-deck-strip"
          className="flex"
          initial={false}
          animate={{ x: `${-deck.active * 100}%` }}
          transition={deck.transition}
        >
          {slides.map((slide, position) => (
            <div key={slide.id} data-slot="card-deck-slide" className="w-full shrink-0" inert={position !== deck.active}>
              <DeckFace slide={slide} />
            </div>
          ))}
        </motion.div>
      </motion.div>
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-border">
        <motion.div
          data-slot="card-deck-progress"
          className="h-full origin-left bg-mise"
          initial={false}
          animate={{ scaleX: (deck.active + 1) / Math.max(deck.count, 1) }}
          transition={deck.transition}
        />
      </div>
    </div>
  )
}

export function StackStage({ slides, deck, swipe }: StageProps) {
  const tilt = useTransform(swipe.dragX, [-DRAG_TILT_RANGE_PX, DRAG_TILT_RANGE_PX], [-DRAG_TILT_DEG, DRAG_TILT_DEG])
  return (
    <div
      data-slot="card-deck-stage"
      data-layout="pile"
      className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] overflow-x-clip pb-6 [&>*]:[grid-area:1/1]", GRAB_CLASS)}
      {...swipe.handlers}
    >
      {slides.map((slide, position) => {
        const place = position - deck.active
        return (
          <motion.div
            key={slide.id}
            data-slot="card-deck-slide"
            data-place={place}
            className={cn("min-w-0 origin-bottom", place !== 0 && "pointer-events-none")}
            style={{ zIndex: deck.count - position }}
            inert={place !== 0}
            initial={false}
            animate={stackPose(place)}
            transition={deck.transition}
          >
            <motion.div
              className={cn("h-full", SURFACE_CLASS)}
              style={place === 0 ? { x: swipe.dragX, rotate: tilt } : undefined}
            >
              <DeckFace slide={slide} />
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}

function CrossfadeSlides({ slides, deck, inverted = false }: { slides: readonly CardDeckSlide[]; deck: DeckState; inverted?: boolean }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] [&>*]:[grid-area:1/1]">
      {slides.map((slide, position) => (
        <motion.div
          key={slide.id}
          data-slot="card-deck-slide"
          className="min-w-0"
          inert={position !== deck.active}
          initial={false}
          animate={{ opacity: position === deck.active ? 1 : 0 }}
          transition={deck.transition}
        >
          <DeckFace slide={slide} tone={inverted ? "inverted" : "plain"} large={inverted} />
        </motion.div>
      ))}
    </div>
  )
}

export function StoryStage({ slides, deck, labels, rewindable }: StageProps) {
  const atEnd = deck.active === deck.last
  return (
    <div data-slot="card-deck-stage" className="relative grid min-w-0 grid-cols-[minmax(0,1fr)] overflow-hidden rounded-xl bg-foreground text-background">
      <div data-slot="card-deck-segments" aria-hidden="true" className="flex gap-1 p-3">
        {slides.map((slide, position) => (
          <span key={slide.id} className="h-0.5 min-w-0 flex-1 overflow-hidden rounded-full bg-background/25">
            <motion.span
              data-seen={position <= deck.active}
              className="block h-full origin-left bg-background"
              initial={false}
              animate={{ scaleX: position <= deck.active ? 1 : 0 }}
              transition={deck.transition}
            />
          </span>
        ))}
      </div>
      <CrossfadeSlides slides={slides} deck={deck} inverted />
      {/* Reading is forward, so the larger zone goes forward. The plain button styles are stripped so the card stays one surface. */}
      <DeckButton
        aria-label={labels.previous}
        inactive={deck.active === 0}
        onClick={() => deck.go(deck.active - 1)}
        className="absolute inset-y-0 left-0 z-10 h-auto w-1/3 rounded-none border-0 bg-transparent hover:bg-transparent aria-disabled:hover:bg-transparent focus-visible:ring-inset"
      />
      <DeckButton
        aria-label={labels.next}
        inactive={atEnd}
        onClick={() => deck.go(deck.active + 1)}
        className="absolute inset-y-0 right-0 z-10 h-auto w-2/3 rounded-none border-0 bg-transparent hover:bg-transparent aria-disabled:hover:bg-transparent focus-visible:ring-inset"
      />
      {rewindable && atEnd ? (
        <DeckRestart deck={deck} labels={labels} className="absolute top-8 right-3 z-20 hover:bg-background/15" />
      ) : null}
    </div>
  )
}

export function OutlineStage({ slides, deck }: StageProps) {
  return (
    <div data-slot="card-deck-stage" className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 @md:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
      <div className="min-w-0 rounded-xl border bg-card text-card-foreground @md:order-2">
        <CrossfadeSlides slides={slides} deck={deck} />
      </div>
      <ol data-slot="card-deck-outline" className="grid min-w-0 content-start gap-1 @md:order-1">
        {slides.map((slide, position) => (
          <li key={slide.id} className="min-w-0">
            <button
              type="button"
              aria-current={position === deck.active ? "true" : undefined}
              onClick={() => deck.go(position)}
              className={cn(
                "flex min-h-10 w-full min-w-0 items-baseline gap-2 rounded-md px-2 py-2 text-start text-[13px] text-muted-foreground outline-none",
                "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:text-foreground",
                "focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-current:bg-muted aria-current:font-medium aria-current:text-foreground",
              )}
            >
              <span aria-hidden="true" className="tabular-nums">{position + 1}</span>
              <span className="min-w-0">{slide.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
