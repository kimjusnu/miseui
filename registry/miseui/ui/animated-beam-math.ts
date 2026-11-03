export type BeamVariant = "line" | "curve" | "step" | "hub"

export interface BeamBox {
  x: number
  y: number
  width: number
  height: number
}

interface RectLike {
  left: number
  top: number
  width: number
  height: number
}

export interface BeamEnds {
  startX: number
  startY: number
  endX: number
  endY: number
  /** Which way the two boxes mostly face each other. */
  axis: "x" | "y"
}

const STEP_RADIUS = 12
const STRAIGHT_BELOW_PX = 1

/** clientLeft and clientTop: the svg sits inside the container's border, its rect does not. */
export function boxWithin(rect: RectLike, container: RectLike, borderLeft = 0, borderTop = 0): BeamBox {
  return { x: rect.left - container.left - borderLeft, y: rect.top - container.top - borderTop, width: rect.width, height: rect.height }
}

export function isDrawable(from: BeamBox, to: BeamBox) {
  return from.width > 0 && from.height > 0 && to.width > 0 && to.height > 0
}

/**
 * Runs edge to edge across the larger clearance, so the line leaves each box from the side facing the other one. A
 * stacked layout gets vertical beams and a row gets horizontal ones, from the same call, which is what lets a beam
 * follow a reflow instead of cutting through a box.
 */
export function beamEnds(from: BeamBox, to: BeamBox): BeamEnds {
  const fromX = from.x + from.width / 2
  const fromY = from.y + from.height / 2
  const toX = to.x + to.width / 2
  const toY = to.y + to.height / 2
  const clearX = Math.abs(toX - fromX) - (from.width + to.width) / 2
  const clearY = Math.abs(toY - fromY) - (from.height + to.height) / 2
  if (clearX >= clearY) {
    const right = toX >= fromX ? 1 : -1
    return { startX: fromX + (right * from.width) / 2, startY: fromY, endX: toX - (right * to.width) / 2, endY: toY, axis: "x" }
  }
  const down = toY >= fromY ? 1 : -1
  return { startX: fromX, startY: fromY + (down * from.height) / 2, endX: toX, endY: toY - (down * to.height) / 2, axis: "y" }
}

const n = (value: number) => Number(value.toFixed(2))

function curvePath({ startX, startY, endX, endY }: BeamEnds, curvature: number) {
  const dx = endX - startX
  const dy = endY - startY
  const length = Math.hypot(dx, dy) || 1
  const controlX = (startX + endX) / 2 + (dy / length) * curvature
  const controlY = (startY + endY) / 2 - (dx / length) * curvature
  return `M ${n(startX)} ${n(startY)} Q ${n(controlX)} ${n(controlY)} ${n(endX)} ${n(endY)}`
}

function stepPath({ startX, startY, endX, endY, axis }: BeamEnds) {
  const across = axis === "x" ? Math.abs(endY - startY) : Math.abs(endX - startX)
  if (across < STRAIGHT_BELOW_PX) return `M ${n(startX)} ${n(startY)} L ${n(endX)} ${n(endY)}`
  const along = axis === "x" ? Math.abs(endX - startX) : Math.abs(endY - startY)
  const radius = Math.min(STEP_RADIUS, along / 2, across / 2)
  if (axis === "x") {
    const midX = (startX + endX) / 2
    const dirX = endX >= startX ? 1 : -1
    const dirY = endY >= startY ? 1 : -1
    return [
      `M ${n(startX)} ${n(startY)}`,
      `L ${n(midX - dirX * radius)} ${n(startY)}`,
      `Q ${n(midX)} ${n(startY)} ${n(midX)} ${n(startY + dirY * radius)}`,
      `L ${n(midX)} ${n(endY - dirY * radius)}`,
      `Q ${n(midX)} ${n(endY)} ${n(midX + dirX * radius)} ${n(endY)}`,
      `L ${n(endX)} ${n(endY)}`,
    ].join(" ")
  }
  const midY = (startY + endY) / 2
  const dirX = endX >= startX ? 1 : -1
  const dirY = endY >= startY ? 1 : -1
  return [
    `M ${n(startX)} ${n(startY)}`,
    `L ${n(startX)} ${n(midY - dirY * radius)}`,
    `Q ${n(startX)} ${n(midY)} ${n(startX + dirX * radius)} ${n(midY)}`,
    `L ${n(endX - dirX * radius)} ${n(midY)}`,
    `Q ${n(endX)} ${n(midY)} ${n(endX)} ${n(midY + dirY * radius)}`,
    `L ${n(endX)} ${n(endY)}`,
  ].join(" ")
}

/** Leaves and arrives square to the box, so many sources gather into one point without crossing it at odd angles. */
function hubPath({ startX, startY, endX, endY, axis }: BeamEnds) {
  if (axis === "x") {
    const midX = (startX + endX) / 2
    return `M ${n(startX)} ${n(startY)} C ${n(midX)} ${n(startY)} ${n(midX)} ${n(endY)} ${n(endX)} ${n(endY)}`
  }
  const midY = (startY + endY) / 2
  return `M ${n(startX)} ${n(startY)} C ${n(startX)} ${n(midY)} ${n(endX)} ${n(midY)} ${n(endX)} ${n(endY)}`
}

/** `reverse` swaps the ends rather than the playback, so the light's bright head still leads the way it moves. */
export function beamPath(from: BeamBox, to: BeamBox, variant: BeamVariant, curvature = 40, reverse = false) {
  if (!isDrawable(from, to)) return null
  const ends = reverse ? beamEnds(to, from) : beamEnds(from, to)
  if (variant === "curve") return curvePath(ends, reverse ? -curvature : curvature)
  if (variant === "step") return stepPath(ends)
  if (variant === "hub") return hubPath(ends)
  return `M ${n(ends.startX)} ${n(ends.startY)} L ${n(ends.endX)} ${n(ends.endY)}`
}
