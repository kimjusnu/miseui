import type { ToastPlacement, ToastVariant } from "@/registry/miseui/ui/toast-item"
import { cn } from "@/registry/miseui/lib/utils"

export type ToastPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"

/** Used until a card reports its height; close to a one-line toast so the first fan-out does not jump far. */
export const FALLBACK_HEIGHT_PX = 64
export const DECK_GAP_PX = 8
const DECK_PEEK_PX = 8
const DECK_SCALE_STEP = 0.05

export const DEFAULT_MAX: Record<ToastVariant, number> = { stack: 3, list: 4, pill: 1, bar: 1 }

const CARD_POSITION: Record<ToastPosition, string> = {
  "top-left": "top-4 left-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-4 right-4",
}

interface DeckInput {
  index: number
  expanded: boolean
  /** Heights of the visible toasts, newest first. */
  heights: readonly number[]
  /** 1 when the toaster sits at the top, -1 at the bottom. */
  direction: 1 | -1
}

/** Where one card sits: a peeking deck at rest, a plain column when fanned out. */
export function deckPlacement({ index, expanded, heights, direction }: DeckInput): ToastPlacement {
  const zIndex = heights.length - index
  if (expanded) {
    const distance = heights.slice(0, index).reduce((sum, height) => sum + height + DECK_GAP_PX, 0)
    return { y: distance * direction, scale: 1, height: heights[index], hideContent: false, zIndex }
  }
  return {
    y: index * DECK_PEEK_PX * direction,
    scale: 1 - index * DECK_SCALE_STEP,
    // Back cards take the front card's height, so a long toast behind a short one does not stick out of the deck.
    height: heights[0],
    hideContent: index > 0,
    zIndex,
  }
}

export function regionClass(variant: ToastVariant, position: ToastPosition, contained: boolean) {
  const isTop = position.startsWith("top")
  const anchor = contained ? "absolute" : "fixed"
  if (variant === "bar") return cn(anchor, "inset-x-0", isTop ? "top-0" : "bottom-0")
  const edge = contained ? (isTop ? "top-2" : "bottom-2") : isTop ? "top-4" : "bottom-4"
  if (variant === "pill") return cn(anchor, edge, "left-1/2 w-max max-w-[calc(100%-1rem)] -translate-x-1/2")
  // A preview is too narrow for corners to mean anything, so contained cards centre.
  if (contained) return cn(anchor, edge, "left-1/2 w-[calc(100%-1rem)] max-w-[22rem] -translate-x-1/2")
  return cn(anchor, CARD_POSITION[position], "w-[min(22rem,calc(100vw-2rem))]")
}
