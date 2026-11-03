export type OrbitVariant = "ring" | "rings" | "tilted" | "arc"

export interface OrbitSlot {
  /** Index of the orbit this item rides, 0 is the innermost. */
  ring: number
  /** Degrees at time zero, measured clockwise from the top. */
  start: number
}

export interface OrbitShape {
  /** Radii in cqw, a share of the root's width, so the whole thing scales with its container. */
  radii: readonly number[]
  /** Vertical squash of the orbit, 1 for a true circle. */
  squash: number
  /** Where the centre sits within the root, in percent of its height. */
  centerTop: number
}

const SHAPES: Record<OrbitVariant, OrbitShape> = {
  ring: { radii: [38], squash: 1, centerTop: 50 },
  rings: { radii: [17, 29.5, 42], squash: 1, centerTop: 50 },
  tilted: { radii: [40], squash: 0.36, centerTop: 50 },
  arc: { radii: [42], squash: 1, centerTop: 100 },
}

const RADIANS = Math.PI / 180

export function orbitShape(variant: OrbitVariant) {
  return SHAPES[variant]
}

/** Inner orbits are short, so they hold fewer items: splitting by the radius keeps the gaps along each orbit about equal. */
export function assignRings(count: number, radii: readonly number[]) {
  if (radii.length === 1) return Array.from({ length: count }, () => 0)
  const total = radii.reduce((sum, radius) => sum + radius, 0)
  const shares = radii.map((radius) => Math.max(1, Math.round((count * radius) / total)))
  const assigned: number[] = []
  shares.forEach((share, ring) => {
    for (let index = 0; index < share; index += 1) assigned.push(ring)
  })
  // Rounding can land one off: fill the outermost, or drop from it.
  while (assigned.length < count) assigned.push(radii.length - 1)
  return assigned.slice(0, count)
}

/**
 * Even spacing per orbit, with orbits offset from each other so no two items line up along a spoke.
 * The arc shows half its circle, so a still frame spreads everything across the top half instead of leaving half out of sight.
 */
export function orbitSlots(variant: OrbitVariant, count: number, still = false): readonly OrbitSlot[] {
  const rings = assignRings(count, SHAPES[variant].radii)
  if (variant === "arc" && still) return rings.map((ring, index) => ({ ring, start: -90 + ((index + 0.5) * 180) / Math.max(count, 1) }))
  const totals = rings.reduce<Record<number, number>>((sum, ring) => ({ ...sum, [ring]: (sum[ring] ?? 0) + 1 }), {})
  const seen: Record<number, number> = {}
  return rings.map((ring) => {
    const position = seen[ring] ?? 0
    seen[ring] = position + 1
    return { ring, start: (position * 360) / (totals[ring] as number) + ring * 37 }
  })
}

/** Further orbits go slower, as planets do, and every other one runs the other way, so the rings read as separate things. */
export function ringVelocity(ring: number, seconds: number) {
  const direction = ring % 2 === 0 ? 1 : -1
  return (direction * 360) / (seconds * (1 + ring * 0.45))
}

export interface OrbitPose {
  /** cqw from the centre. */
  x: number
  y: number
  scale: number
  opacity: number
  /** True on the far half of a tilted orbit: the item passes behind the centre. */
  behind: boolean
}

const FAR_SCALE = 0.72
const FAR_OPACITY = 0.5
const ARC_FADE_CQW = 12

/** The box edge would otherwise slice an item in half, and with no visible box around the arc that reads as a broken circle. */
function arcOpacity(y: number) {
  const share = Math.min(1, Math.max(0, -y / ARC_FADE_CQW))
  return share * share * (3 - 2 * share)
}

export function orbitPose(variant: OrbitVariant, slot: OrbitSlot, turn: number): OrbitPose {
  const shape = SHAPES[variant]
  const radius = shape.radii[slot.ring] as number
  const angle = (slot.start + turn) * RADIANS
  const x = radius * Math.sin(angle)
  const circleY = -Math.cos(angle)
  const y = radius * shape.squash * circleY
  if (variant === "arc") return { x, y, scale: 1, opacity: arcOpacity(y), behind: false }
  if (variant !== "tilted") return { x, y, scale: 1, opacity: 1, behind: false }
  // Below the centre on screen is nearer the viewer in a ring seen from above.
  const nearness = (circleY + 1) / 2
  return { x, y, scale: FAR_SCALE + (1 - FAR_SCALE) * nearness, opacity: FAR_OPACITY + (1 - FAR_OPACITY) * nearness, behind: circleY < 0 }
}

/** One short string per item per frame, and none of it re-renders React. */
export function poseTransform({ x, y, scale }: OrbitPose) {
  const base = `translate(-50%, -50%) translate(${x.toFixed(2)}cqw, ${y.toFixed(2)}cqw)`
  return scale === 1 ? base : `${base} scale(${scale.toFixed(3)})`
}

/** How far a turn must go for this slot to reach the top of its orbit: the arc hides half its circle, so a focused item is brought into view. */
export function turnToTop(start: number, turn: number) {
  const current = ((start + turn) % 360 + 360) % 360
  return current > 180 ? 360 - current : -current
}

export type LabelSide = "start" | "center" | "end"

/** A label near an edge grows inward and on the side away from the rim, so it stays inside the root in the narrowest cell. */
export function labelPlacement(x: number, y: number, top: number): { side: LabelSide; below: boolean } {
  const side: LabelSide = x > 12 ? "end" : x < -12 ? "start" : "center"
  return { side, below: top >= 100 ? false : y < 0 }
}
