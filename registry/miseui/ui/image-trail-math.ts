import { between, seededRandom } from "@/registry/miseui/ui/background-seed"

export type ImageTrailVariant = "trail" | "pile" | "fan" | "strip"

export interface Point {
  x: number
  y: number
}

/** A fixed pool: a fast pointer reuses the oldest picture instead of growing the page. */
export const POOL_SIZE = 12
/** A pointer that jumps across the box in one event should leave a few pictures, not every one in the pool. */
const MAX_SPAWNS_PER_EVENT = 3

/**
 * Spawning by distance keeps the spacing even at any speed; by time it would bunch up when slow and gap when fast.
 * Points fall along the path from the last spawn, and the leftover distance stays with the anchor.
 */
export function spawnPoints(anchor: Point, point: Point, spacing: number): { points: readonly Point[]; anchor: Point } {
  const distance = Math.hypot(point.x - anchor.x, point.y - anchor.y)
  if (spacing <= 0 || distance < spacing) return { points: [], anchor }
  const count = Math.floor(distance / spacing)
  const unit = pathDirection(anchor, point)
  const at = (step: number) => ({ x: anchor.x + unit.x * spacing * step, y: anchor.y + unit.y * spacing * step })
  const first = Math.max(1, count - MAX_SPAWNS_PER_EVENT + 1)
  const points = Array.from({ length: count - first + 1 }, (_, index) => at(first + index))
  return { points, anchor: at(count) }
}

export function pathDirection(from: Point, to: Point): Point {
  const length = Math.hypot(to.x - from.x, to.y - from.y)
  return length === 0 ? { x: 1, y: 0 } : { x: (to.x - from.x) / length, y: (to.y - from.y) / length }
}

/** 0.8 for a slow drift, 1.5 for a fast sweep. Past about 2 px per ms a pointer is simply moving fast. */
export function speedScale(pxPerMs: number) {
  const progress = Math.min(1, Math.max(0, pxPerMs / 2))
  return Math.round((0.8 + progress * 0.7) * 100) / 100
}

const ROTATION_RANGE: Record<ImageTrailVariant, number> = { trail: 4, pile: 8, fan: 18, strip: 0 }

/** Seeded, so the same order of spawns always falls the same way and tests can read it. */
export function seededRotation(variant: ImageTrailVariant, index: number) {
  const range = ROTATION_RANGE[variant]
  if (range === 0) return 0
  return between(seededRandom(index + 1), -range, range)
}

interface SpawnInput {
  x: number
  y: number
  scale: number
  rotation: number
  direction: Point
}

interface SpawnAnimation {
  keyframes: Keyframe[]
  options: KeyframeAnimationOptions
}

const transformAt = (x: number, y: number, rotation: number, scale: number) => `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rotation}deg) scale(${scale})`

const POP = "cubic-bezier(0.16, 1, 0.3, 1)"

/** Each entry is the whole life of a picture. `pile` only arrives, and stays until the pointer rests. */
export function spawnAnimation(variant: ImageTrailVariant, { x, y, scale, rotation, direction }: SpawnInput): SpawnAnimation {
  const fill = "both" as const
  if (variant === "pile") {
    return {
      keyframes: [
        { opacity: 0, transform: transformAt(x, y, rotation * 0.4, scale * 0.8), easing: POP },
        { opacity: 1, transform: transformAt(x, y, rotation, scale) },
      ],
      options: { duration: 240, fill },
    }
  }
  if (variant === "fan") {
    return {
      keyframes: [
        { opacity: 0, offset: 0, transform: transformAt(x, y, 0, scale * 0.4), easing: POP },
        { opacity: 1, offset: 0.22, transform: transformAt(x, y, rotation, scale) },
        { opacity: 1, offset: 0.65, transform: transformAt(x, y, rotation, scale) },
        { opacity: 0, offset: 1, transform: transformAt(x, y, rotation * 1.2, scale * 0.94) },
      ],
      options: { duration: 1200, fill },
    }
  }
  if (variant === "strip") {
    const before = { x: x - direction.x * 40, y: y - direction.y * 40 }
    const after = { x: x + direction.x * 16, y: y + direction.y * 16 }
    return {
      keyframes: [
        { opacity: 0, offset: 0, transform: transformAt(before.x, before.y, 0, scale), easing: POP },
        { opacity: 1, offset: 0.3, transform: transformAt(x, y, 0, scale) },
        { opacity: 1, offset: 0.6, transform: transformAt(x, y, 0, scale) },
        { opacity: 0, offset: 1, transform: transformAt(after.x, after.y, 0, scale) },
      ],
      options: { duration: 1000, fill },
    }
  }
  return {
    keyframes: [
      { opacity: 0, offset: 0, transform: transformAt(x, y, rotation, scale * 0.7), easing: POP },
      { opacity: 1, offset: 0.16, transform: transformAt(x, y, rotation, scale) },
      { opacity: 1, offset: 0.5, transform: transformAt(x, y, rotation, scale) },
      { opacity: 0, offset: 1, transform: transformAt(x, y, rotation, scale * 0.9) },
    ],
    options: { duration: 900, fill },
  }
}

export function clearAnimation(rest: string, order: number): SpawnAnimation {
  return {
    keyframes: [
      { opacity: 1, transform: rest },
      { opacity: 0, transform: `${rest} scale(0.92)` },
    ],
    options: { duration: 240, delay: order * 30, fill: "both", easing: "ease-out" },
  }
}

export interface StillPlace {
  left: number
  top: number
  rotate: number
}

/** Kept to the edges, so the words in the middle of the box stay clear. Each one previews how its variant behaves. */
export const STILL_LAYOUT: Record<ImageTrailVariant, readonly StillPlace[]> = {
  trail: [
    { left: 17, top: 21, rotate: -6 },
    { left: 83, top: 20, rotate: 5 },
    { left: 16, top: 80, rotate: 4 },
    { left: 84, top: 79, rotate: -5 },
  ],
  pile: [
    { left: 76, top: 74, rotate: -8 },
    { left: 82, top: 72, rotate: 6 },
    { left: 79, top: 78, rotate: -1 },
  ],
  fan: [
    { left: 33, top: 88, rotate: -16 },
    { left: 50, top: 84, rotate: 0 },
    { left: 67, top: 88, rotate: 16 },
  ],
  strip: [
    { left: 18, top: 84, rotate: 0 },
    { left: 50, top: 84, rotate: 0 },
    { left: 82, top: 84, rotate: 0 },
  ],
}
