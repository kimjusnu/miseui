import type { ParticleField, ParticleVariant } from "@/registry/miseui/ui/particles-background-engine"

const LINK_LEVELS = 4
const MAX_LINKS_PER_POINT = 3

/** Links per frame are stored in reused arrays: same reason as the engine. */
export interface LinkBuffer {
  a: Uint16Array
  b: Uint16Array
  level: Uint8Array
  used: Uint8Array
  head: Int32Array
  next: Int32Array
  cols: number
  rows: number
  cell: number
  count: number
}

/** A little past the average gap between points, so each sees about four neighbours whatever the box and the count. */
export function linkDistance(width: number, height: number, count: number) {
  return Math.min(200, Math.max(64, Math.sqrt((width * height) / Math.max(1, count)) * 1.2))
}

export function createLinkBuffer(field: ParticleField, distance: number): LinkBuffer {
  const capacity = (field.count + 1) * MAX_LINKS_PER_POINT
  const cols = Math.max(1, Math.ceil(field.width / distance))
  const rows = Math.max(1, Math.ceil(field.height / distance))
  return {
    a: new Uint16Array(capacity),
    b: new Uint16Array(capacity),
    level: new Uint8Array(capacity),
    used: new Uint8Array(field.count + 1),
    head: new Int32Array(cols * rows),
    next: new Int32Array(field.count),
    cols,
    rows,
    cell: distance,
    count: 0,
  }
}

function fillGrid(field: ParticleField, buffer: LinkBuffer) {
  const { head, next, cols, rows, cell } = buffer
  head.fill(-1)
  for (let i = 0; i < field.count; i += 1) {
    // Points can sit a little past the edge before they bounce; the outer cells take them.
    const col = Math.min(cols - 1, Math.max(0, Math.floor((field.x[i] as number) / cell)))
    const row = Math.min(rows - 1, Math.max(0, Math.floor((field.y[i] as number) / cell)))
    const index = row * cols + col
    next[i] = head[index] as number
    head[index] = i
  }
}

function tryLink(field: ParticleField, buffer: LinkBuffer, i: number, j: number, distance: number, maxPerPoint: number) {
  if (buffer.count >= buffer.a.length) return
  if ((buffer.used[i] as number) >= maxPerPoint || (buffer.used[j] as number) >= maxPerPoint) return
  const gap = Math.hypot((field.x[i] as number) - (field.x[j] as number), (field.y[i] as number) - (field.y[j] as number))
  if (gap >= distance) return
  buffer.a[buffer.count] = i
  buffer.b[buffer.count] = j
  buffer.level[buffer.count] = Math.min(LINK_LEVELS - 1, Math.floor((1 - gap / distance) * LINK_LEVELS))
  buffer.used[i] = (buffer.used[i] as number) + 1
  buffer.used[j] = (buffer.used[j] as number) + 1
  buffer.count += 1
}

/** Half the neighbours, so each pair is met once: same cell, right, and the row below. */
const FORWARD_CELLS = [
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as const

function linkCell(field: ParticleField, buffer: LinkBuffer, col: number, row: number, distance: number, maxPerPoint: number) {
  const { head, next, cols, rows } = buffer
  for (let i = head[row * cols + col] as number; i !== -1; i = next[i] as number) {
    for (let j = next[i] as number; j !== -1; j = next[j] as number) tryLink(field, buffer, i, j, distance, maxPerPoint)
    for (const [stepCol, stepRow] of FORWARD_CELLS) {
      const otherCol = col + stepCol
      const otherRow = row + stepRow
      if (otherCol < 0 || otherCol >= cols || otherRow >= rows) continue
      for (let j = head[otherRow * cols + otherCol] as number; j !== -1; j = next[j] as number) tryLink(field, buffer, i, j, distance, maxPerPoint)
    }
  }
}

/** Fills the buffer with near pairs, O(n) through the grid. `pointer` true links the slot past the last point as well. */
export function linkParticles(field: ParticleField, buffer: LinkBuffer, distance: number, pointer = false, maxPerPoint = MAX_LINKS_PER_POINT) {
  buffer.count = 0
  buffer.used.fill(0)
  fillGrid(field, buffer)
  for (let row = 0; row < buffer.rows; row += 1) {
    for (let col = 0; col < buffer.cols; col += 1) linkCell(field, buffer, col, row, distance, maxPerPoint)
  }
  if (pointer) for (let i = 0; i < field.count; i += 1) tryLink(field, buffer, field.count, i, distance * 1.2, Number.MAX_SAFE_INTEGER)
  return buffer.count
}

export interface Shade {
  alpha: number
  tone: "accent" | "neutral"
}

const ACCENT_STEPS: readonly Shade[] = [0.14, 0.26, 0.38, 0.5, 0.62, 0.74].map((alpha) => ({ alpha, tone: "accent" }))

/** Few alphas, so the painter fills one path per alpha instead of one fill per point. */
export const SHADES: Record<ParticleVariant, readonly Shade[]> = {
  drift: ACCENT_STEPS,
  constellation: ACCENT_STEPS,
  rise: ACCENT_STEPS,
  field: [
    { alpha: 0.08, tone: "neutral" },
    { alpha: 0.2, tone: "neutral" },
    { alpha: 0.36, tone: "neutral" },
    { alpha: 0.75, tone: "accent" },
  ],
}

export const LINK_ALPHAS = [0.08, 0.14, 0.2, 0.26] as const

/** Which entry of SHADES a point gets this frame. */
export function shadeOf(field: ParticleField, i: number) {
  const life = field.life[i] as number
  if (field.variant === "field") {
    if (field.heat * Math.sin(Math.PI * life) > 0.5) return 3
    if (life > 0.55) return 0
    return life > 0.25 ? 1 : 2
  }
  const strength = field.variant === "rise" ? Math.sin(Math.PI * life) : ((field.size[i] as number) - 1) / 1.2
  return Math.min(ACCENT_STEPS.length - 1, Math.max(0, Math.floor(strength * ACCENT_STEPS.length)))
}
