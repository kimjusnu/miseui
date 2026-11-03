export interface Point {
  x: number
  y: number
}

export interface Box {
  left: number
  top: number
  right: number
  bottom: number
}

/** How far a point is from a box. Zero anywhere inside it. */
export function distanceToBox(point: Point, box: Box) {
  const dx = Math.max(box.left - point.x, 0, point.x - box.right)
  const dy = Math.max(box.top - point.y, 0, point.y - box.bottom)
  return Math.hypot(dx, dy)
}

/** Full strength on and inside the element, easing to nothing at `reach` with no visible start or stop. */
export function magnetFalloff(distance: number, reach: number) {
  if (reach <= 0) return distance <= 0 ? 1 : 0
  const progress = Math.min(1, Math.max(0, distance / reach))
  const inverse = 1 - progress
  return inverse * inverse * (3 - 2 * inverse)
}

/**
 * How far the element moves toward the pointer. Capped, because a wide element would otherwise travel by half
 * its own width when the pointer reaches its far edge.
 */
export function magnetPull(point: Point, box: Box, strength: number, falloff: number, maxOffset: number): Point {
  const x = (point.x - (box.left + box.right) / 2) * strength * falloff
  const y = (point.y - (box.top + box.bottom) / 2) * strength * falloff
  const length = Math.hypot(x, y)
  if (length <= maxOffset) return { x, y }
  return { x: (x / length) * maxOffset, y: (y / length) * maxOffset }
}

/**
 * Two radii give the latch a dead band: a pointer resting on one circle would otherwise flip it every frame.
 * Distance comes from the still wrapper, so the moving element cannot change its own answer.
 */
export function nextLatched(latched: boolean, distance: number, latchRadius: number, releaseRadius: number) {
  return latched ? distance <= releaseRadius : distance <= latchRadius
}
