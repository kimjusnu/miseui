import { between, seededRandom } from "@/registry/miseui/ui/background-seed"

export type CardPose = {
  x: number
  y: number
  rotate: number
  scale: number
  opacity: number
}

const MIN_FLING_PX = 80
const FLING_SHARE = 0.35
const FLICK_VELOCITY = 500
const SHOWN_IN_PILE = 3

/** How far behind the top a card sits, once `top` has rotated round. */
export function depthOf(index: number, top: number, count: number) {
  if (count <= 0) return 0
  return ((index - top) % count + count) % count
}

/** A flick counts even when short: speed says what someone meant as much as distance does. */
export function shouldLeave(offsetX: number, velocityX: number, width: number) {
  return Math.abs(offsetX) > Math.max(MIN_FLING_PX, width * FLING_SHARE) || Math.abs(velocityX) > FLICK_VELOCITY
}

/** Seeded so server and client agree, and so the scatter stays put when the order changes: a card keeps its own tilt. */
export function pilePose(index: number, depth: number, count: number, seed = 1): CardPose {
  const random = seededRandom(seed * 7919 + index * 104729)
  const shown = Math.min(depth, SHOWN_IN_PILE)
  // The top card sits true, so its text reads level. The others show their own scatter behind it.
  const tilt = depth === 0 ? 0 : between(random, -3.5, 3.5)
  const shiftX = depth === 0 ? 0 : between(random, -6, 6)
  const shiftY = depth === 0 ? 0 : between(random, 2, 8)
  return {
    x: shiftX,
    y: shiftY + shown * 2,
    rotate: tilt,
    scale: 1 - shown * 0.015,
    opacity: depth < count && depth <= SHOWN_IN_PILE ? 1 : 0,
  }
}

const FAN_CLOSED_DEGREES = 2.5
const FAN_OPEN_DEGREES = 11
const FAN_MAX_OUTER_DEGREES = 22

export interface FanFit {
  /** Degrees between neighbours when open. */
  spread: number
  /** Pixels between neighbours when open. */
  gap: number
}

/** The widest a fan can open and still keep its outer corners inside the root, whatever the card and cell sizes are. */
export function fitFan(count: number, rootWidth: number, cardWidth: number, cardHeight: number): FanFit {
  if (count < 2 || rootWidth <= 0 || cardWidth <= 0) return { spread: FAN_OPEN_DEGREES, gap: 0 }
  const half = (count - 1) / 2
  // Past this outer angle a bottom corner dips below the reserved room.
  let spread = Math.min(FAN_OPEN_DEGREES, FAN_MAX_OUTER_DEGREES / half)
  // Ten shrinks are plenty: the first one that fits is taken, and most cards fit at full spread.
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const outer = (spread * half * Math.PI) / 180
    const reach = (cardWidth / 2) * Math.cos(outer) + cardHeight * Math.sin(outer)
    const room = rootWidth / 2 - reach
    if (room >= 0) return { spread, gap: Math.min(room / Math.max(half, 1), cardWidth * 0.18) }
    spread *= 0.82
  }
  return { spread, gap: 0 }
}

export function fanPose(index: number, count: number, open: boolean, fit: FanFit): CardPose {
  const offset = index - (count - 1) / 2
  if (!open) return { x: 0, y: 0, rotate: offset * (FAN_CLOSED_DEGREES / Math.max((count - 1) / 2, 1)), scale: 1, opacity: 1 }
  return { x: offset * fit.gap, y: Math.abs(offset) * 3, rotate: offset * fit.spread, scale: 1, opacity: 1 }
}

const PEEK_PX = 8
const PEEK_SCALE = 0.04
const PEEKS = 2

export const CASCADE_GAP = 8
/** Bottom room the peeking rows need when closed. */
export const CASCADE_PEEK_ROOM = PEEK_PX * PEEKS

export function cascadePose(depth: number, open: boolean, rowHeight: number): CardPose {
  if (open) return { x: 0, y: depth * (rowHeight + CASCADE_GAP), rotate: 0, scale: 1, opacity: 1 }
  // Scaling from the row's own bottom edge: the peek stays a thin strip however tall the row is.
  const shown = Math.min(depth, PEEKS)
  return { x: 0, y: shown * PEEK_PX, rotate: 0, scale: 1 - shown * PEEK_SCALE, opacity: depth > PEEKS ? 0 : 1 }
}

export type SwipeChoice = "left" | "right"

/** Past this share of the way, the tint has said all it can. */
export function swipeTint(offsetX: number, width: number) {
  const room = Math.max(width * FLING_SHARE, MIN_FLING_PX)
  return Math.min(Math.abs(offsetX) / room, 1)
}
