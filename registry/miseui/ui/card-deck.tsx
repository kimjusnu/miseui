import type * as React from "react"
import { useReducedMotion } from "motion/react"
import {
  DeckControls,
  DEFAULT_LABELS,
  type CardDeckLabels,
  type CardDeckSlide,
  type CardDeckStat,
} from "@/registry/miseui/ui/card-deck-parts"
import { OutlineStage, StackStage, StoryStage, StripStage } from "@/registry/miseui/ui/card-deck-stages"
import { useDeckState, useDeckSwipe } from "@/registry/miseui/ui/card-deck-state"
import { cn } from "@/registry/miseui/lib/utils"

type CardDeckVariant = "slides" | "stack" | "story" | "outline"
type CardDeckEffect = "rewind"

const STAGE = { slides: StripStage, stack: StackStage, story: StoryStage, outline: OutlineStage } as const

type RootAttributes = Omit<React.ComponentProps<"section">, "children" | "onKeyDown">

interface CardDeckProps extends RootAttributes {
  /** What this deck is, read out when someone enters it. */
  label: string
  slides: readonly CardDeckSlide[]
  /** `slides` a strip you swipe, `stack` a pile you throw from, `story` tap zones and segments, `outline` titles beside the slide. */
  variant?: CardDeckVariant
  /** `rewind` adds Start over: the deck runs back through every slide passed, so the way back reads as the way back. */
  effect?: CardDeckEffect
  index?: number
  defaultIndex?: number
  /** Fires for each slide a rewind passes, so a controlled deck can follow it. */
  onIndexChange?: (index: number) => void
  labels?: Partial<CardDeckLabels>
}

function CardDeck({
  label,
  slides,
  variant = "slides",
  effect,
  index,
  defaultIndex = 0,
  onIndexChange,
  labels,
  className,
  ...props
}: CardDeckProps) {
  const reduceMotion = useReducedMotion() ?? false
  const rewindable = effect === "rewind"
  const merged = { ...DEFAULT_LABELS, ...labels }
  const deck = useDeckState({ count: slides.length, index, defaultIndex, onIndexChange, rewindable, reduceMotion })
  const swipe = useDeckSwipe(deck, reduceMotion)
  const Stage = STAGE[variant]
  const current = slides[deck.active]
  return (
    <section
      aria-roledescription="slide deck"
      aria-label={label}
      data-slot="card-deck"
      data-variant={variant}
      data-effect={effect}
      className={cn("@container grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-3", className)}
      onKeyDown={deck.onKeyDown}
      {...props}
    >
      <Stage slides={slides} deck={deck} swipe={swipe} labels={merged} rewindable={rewindable} />
      {variant === "story" ? null : <DeckControls deck={deck} labels={merged} rewindable={rewindable} />}
      <p className="sr-only" aria-live={deck.rewinding ? "off" : "polite"} aria-atomic="true">
        {current ? merged.slide(deck.active + 1, slides.length, current.title) : ""}
      </p>
    </section>
  )
}

export {
  CardDeck,
  type CardDeckProps,
  type CardDeckSlide,
  type CardDeckStat,
  type CardDeckVariant,
  type CardDeckEffect,
  type CardDeckLabels,
}
