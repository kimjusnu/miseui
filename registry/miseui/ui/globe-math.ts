import { LAND_COLUMNS, LAND_MASK, LAND_ROWS } from "@/registry/miseui/ui/globe-land"

export interface GlobePoint {
  lat: number
  lng: number
}

const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
const CELL_DEGREES = 360 / LAND_COLUMNS
const RADIANS = Math.PI / 180

/** Written out because Buffer does not exist in a browser and atob does not exist in every server runtime. */
export function decodeBase64(text: string) {
  const clean = text.replace(/=+$/, "")
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4))
  let buffer = 0
  let bits = 0
  let written = 0
  for (const letter of clean) {
    buffer = (buffer << 6) | BASE64.indexOf(letter)
    bits += 6
    if (bits >= 8) {
      bits -= 8
      bytes[written] = (buffer >> bits) & 255
      written += 1
      buffer &= (1 << bits) - 1
    }
  }
  return bytes
}

let decodedMask: Uint8Array | null = null

export function landMask() {
  decodedMask ??= decodeBase64(LAND_MASK)
  return decodedMask
}

function cellIsLand(mask: Uint8Array, row: number, column: number) {
  const clampedRow = Math.min(Math.max(row, 0), LAND_ROWS - 1)
  const wrappedColumn = ((column % LAND_COLUMNS) + LAND_COLUMNS) % LAND_COLUMNS
  const bit = clampedRow * LAND_COLUMNS + wrappedColumn
  return (((mask[bit >> 3] as number) >> (bit & 7)) & 1) as 0 | 1
}

export function isLand(lat: number, lng: number, mask = landMask()) {
  const row = Math.floor((90 - lat) / CELL_DEGREES)
  const column = Math.floor((lng + 180) / CELL_DEGREES)
  return cellIsLand(mask, row, column) === 1
}

/**
 * How much land surrounds a point, 0 to 1, read between cell centres. Taking the nearest cell instead draws the 2.5
 * degree staircase on every coast as soon as anything is sampled finer than the mask.
 */
export function landShare(lat: number, lng: number, mask = landMask()) {
  const rowAt = (90 - lat) / CELL_DEGREES - 0.5
  const columnAt = (lng + 180) / CELL_DEGREES - 0.5
  const row = Math.floor(rowAt)
  const column = Math.floor(columnAt)
  const down = rowAt - row
  const across = columnAt - column
  const top = cellIsLand(mask, row, column) * (1 - across) + cellIsLand(mask, row, column + 1) * across
  const bottom = cellIsLand(mask, row + 1, column) * (1 - across) + cellIsLand(mask, row + 1, column + 1) * across
  return top * (1 - down) + bottom * down
}

/** A row near a pole is a short circle, so it gets fewer dots. A plain grid bunches them into a ring at each pole. */
export function rowDotCount(lat: number, stepDegrees: number) {
  return Math.max(1, Math.round((360 * Math.cos(lat * RADIANS)) / stepDegrees))
}

export function toUnitVector({ lat, lng }: GlobePoint): readonly [number, number, number] {
  const phi = lat * RADIANS
  const lambda = lng * RADIANS
  return [Math.cos(phi) * Math.sin(lambda), Math.sin(phi), Math.cos(phi) * Math.cos(lambda)]
}

const LAND_THRESHOLD = 0.42

/** Unit vectors of the land dots as flat x, y, z. Every other row is shifted half a step, so no straight lines of dots run across a coast. */
export function sampleLandDots(stepDegrees: number, mask = landMask()) {
  const found: number[] = []
  const rows = Math.round(180 / stepDegrees)
  for (let row = 0; row < rows; row += 1) {
    const lat = 90 - ((row + 0.5) * 180) / rows
    const count = rowDotCount(lat, stepDegrees)
    for (let index = 0; index < count; index += 1) {
      const lng = -180 + ((index + (row % 2 ? 0.5 : 0.25)) * 360) / count
      if (landShare(lat, lng, mask) >= LAND_THRESHOLD) found.push(...toUnitVector({ lat, lng }))
    }
  }
  return Float32Array.from(found)
}

export interface GlobeView {
  sinLng: number
  cosLng: number
  sinTilt: number
  cosTilt: number
}

export function createView(lng: number, tilt: number): GlobeView {
  return { sinLng: Math.sin(lng * RADIANS), cosLng: Math.cos(lng * RADIANS), sinTilt: Math.sin(tilt * RADIANS), cosTilt: Math.cos(tilt * RADIANS) }
}

/** Turns the point so the view's centre lies at x 0, y 0, z 1. Orthographic: x and y are already the screen, z is depth. */
export function rotatePoint(x: number, y: number, z: number, view: GlobeView): readonly [number, number, number] {
  const turnedX = x * view.cosLng - z * view.sinLng
  const turnedZ = x * view.sinLng + z * view.cosLng
  return [turnedX, y * view.cosTilt - turnedZ * view.sinTilt, y * view.sinTilt + turnedZ * view.cosTilt]
}

/** Writes the near side into `out` as flat x, y, z and returns how many fit. `out` is reused each frame, so a turning globe allocates nothing. */
export function projectDots(units: Float32Array, view: GlobeView, out: Float32Array) {
  const { sinLng, cosLng, sinTilt, cosTilt } = view
  let visible = 0
  for (let index = 0; index < units.length; index += 3) {
    const x = units[index] as number
    const y = units[index + 1] as number
    const z = units[index + 2] as number
    const turnedZ = x * sinLng + z * cosLng
    const depth = y * sinTilt + turnedZ * cosTilt
    if (depth <= 0) continue
    out[visible] = x * cosLng - z * sinLng
    out[visible + 1] = y * cosTilt - turnedZ * sinTilt
    out[visible + 2] = depth
    visible += 3
  }
  return visible / 3
}

/** An arc lifted off the surface: still a great circle in plan, and lifted so it reads as a path rather than a scratch on the sphere. */
export function greatCirclePoints(from: GlobePoint, to: GlobePoint, segments: number, lift = 0) {
  const a = toUnitVector(from)
  const b = toUnitVector(to)
  const dot = Math.min(Math.max(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1), 1)
  const omega = Math.acos(dot)
  const sinOmega = Math.sin(omega)
  const points = new Float32Array((segments + 1) * 3)
  for (let step = 0; step <= segments; step += 1) {
    const share = step / segments
    // Identical or opposite ends have no single great circle; a straight blend at least never divides by zero.
    const fromWeight = sinOmega < 1e-5 ? 1 - share : Math.sin((1 - share) * omega) / sinOmega
    const toWeight = sinOmega < 1e-5 ? share : Math.sin(share * omega) / sinOmega
    const height = 1 + lift * Math.sin(share * Math.PI)
    points.set([0, 1, 2].map((axis) => (fromWeight * (a[axis] as number) + toWeight * (b[axis] as number)) * height), step * 3)
  }
  return points
}

/** A point lifted past the rim shows beside the disc even with negative depth; only a point over the disc can be behind it. */
export function isArcPointVisible(x: number, y: number, z: number) {
  return z >= 0 || x * x + y * y >= 1
}

export const SPIN_DEGREES_PER_SECOND = 6
const SPIN_EASE_SECONDS = 0.7

export interface Spin {
  angle: number
  velocity: number
}

/** Velocity relaxes toward its target, so a flick decays into the slow turn with no seam, and pausing eases out instead of stopping dead. */
export function stepSpin(spin: Spin, targetVelocity: number, seconds: number): Spin {
  const velocity = targetVelocity + (spin.velocity - targetVelocity) * Math.exp(-seconds / SPIN_EASE_SECONDS)
  return { angle: normalizeDegrees(spin.angle + velocity * seconds), velocity }
}

export function normalizeDegrees(degrees: number) {
  return ((((degrees + 180) % 360) + 360) % 360) - 180
}

/** Degrees that keep the land at the centre of the disc under the finger. */
export function dragDegrees(pixels: number, radius: number) {
  return radius > 0 ? ((-pixels / radius) * 180) / Math.PI : 0
}

/** Dots stay about the same distance apart at any size. A large globe gets more of them, up to where the mask has nothing finer to show. */
export function dotStep(radius: number, spacingPx = 5.6) {
  if (radius <= 0) return 2.5
  return Math.min(Math.max(((spacingPx / radius) * 180) / Math.PI, 1.5), 2.8)
}
