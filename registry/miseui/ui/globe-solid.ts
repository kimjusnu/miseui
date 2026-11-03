import type { Rgb } from "@/registry/miseui/ui/globe-color"
import { LAND_COLUMNS, LAND_ROWS } from "@/registry/miseui/ui/globe-land"
import { landMask } from "@/registry/miseui/ui/globe-math"

export const TEXTURE_WIDTH = 1024
export const TEXTURE_HEIGHT = 512
const EDGE_FROM = 0.44
const EDGE_WIDTH = 0.08
const RADIANS = Math.PI / 180
/** From the upper left, as on most things people have seen lit. */
const LIGHT_X = -0.42
const LIGHT_Y = 0.5
const LIGHT_Z = 0.76
const OCEAN_FLOOR = 0.82
const LAND_FLOOR = 0.84
const SHEEN = 0.1

/** Weights chosen so a one-cell island still clears the edge threshold: it stays on the map, only its corners go. */
function softenedCells(mask: Uint8Array) {
  const bits = new Uint8Array(LAND_COLUMNS * LAND_ROWS)
  for (let bit = 0; bit < bits.length; bit += 1) bits[bit] = ((mask[bit >> 3] as number) >> (bit & 7)) & 1
  const at = (row: number, column: number) => bits[Math.min(Math.max(row, 0), LAND_ROWS - 1) * LAND_COLUMNS + ((column + LAND_COLUMNS) % LAND_COLUMNS)] as number
  const cells = new Float32Array(bits.length)
  for (let row = 0; row < LAND_ROWS; row += 1) {
    for (let column = 0; column < LAND_COLUMNS; column += 1) {
      const sides = at(row - 1, column) + at(row + 1, column) + at(row, column - 1) + at(row, column + 1)
      const corners = at(row - 1, column - 1) + at(row - 1, column + 1) + at(row + 1, column - 1) + at(row + 1, column + 1)
      cells[row * LAND_COLUMNS + column] = (at(row, column) * 8 + sides + corners / 2) / 14
    }
  }
  return cells
}

let texture: Uint8Array | null = null

/** Land as coverage, 0 to 255. The coarse mask is softened first, so a coast reads as a shape and not as 2.5 degree steps. Built once per page. */
export function landTexture() {
  if (texture) return texture
  const built = new Uint8Array(TEXTURE_WIDTH * TEXTURE_HEIGHT)
  const cells = softenedCells(landMask())
  const left = new Int32Array(TEXTURE_WIDTH)
  const right = new Int32Array(TEXTURE_WIDTH)
  const across = new Float32Array(TEXTURE_WIDTH)
  for (let column = 0; column < TEXTURE_WIDTH; column += 1) {
    const at = ((column + 0.5) / TEXTURE_WIDTH) * LAND_COLUMNS - 0.5
    const floor = Math.floor(at)
    left[column] = (floor + LAND_COLUMNS) % LAND_COLUMNS
    right[column] = (floor + 1) % LAND_COLUMNS
    across[column] = at - floor
  }
  for (let row = 0; row < TEXTURE_HEIGHT; row += 1) {
    const at = ((row + 0.5) / TEXTURE_HEIGHT) * LAND_ROWS - 0.5
    const floor = Math.floor(at)
    const down = at - floor
    const top = Math.max(floor, 0) * LAND_COLUMNS
    const bottom = Math.min(floor + 1, LAND_ROWS - 1) * LAND_COLUMNS
    for (let column = 0; column < TEXTURE_WIDTH; column += 1) {
      const a = left[column] as number
      const b = right[column] as number
      const share = across[column] as number
      const upper = (cells[top + a] as number) * (1 - share) + (cells[top + b] as number) * share
      const lower = (cells[bottom + a] as number) * (1 - share) + (cells[bottom + b] as number) * share
      const edge = (upper * (1 - down) + lower * down - EDGE_FROM) / EDGE_WIDTH
      built[row * TEXTURE_WIDTH + column] = edge <= 0 ? 0 : edge >= 1 ? 255 : edge * 255
    }
  }
  texture = built
  return built
}

/** What a pixel always sees for one size and tilt. Changing theme recolours from this, without any trigonometry. */
interface Geometry {
  key: string
  pixels: Int32Array
  rows: Int32Array
  columns: Int32Array
  facing: Float32Array
  cover: Uint8Array
}

/**
 * Tilt never changes while the globe turns, so a pixel always sees the same latitude and the same longitude offset.
 * All of it is worked out once, and turning only adds to the column: the look of per-pixel shading, without per-frame trigonometry.
 */
function buildGeometry(size: number, tiltDegrees: number): Geometry {
  const radius = size / 2 - 0.5
  const centre = size / 2
  const sinTilt = Math.sin(tiltDegrees * RADIANS)
  const cosTilt = Math.cos(tiltDegrees * RADIANS)
  const capacity = Math.ceil(Math.PI * (radius + 2) ** 2)
  const pixels = new Int32Array(capacity)
  const rows = new Int32Array(capacity)
  const columns = new Int32Array(capacity)
  const facing = new Float32Array(capacity)
  const cover = new Uint8Array(capacity)
  const inner = (1 - 0.5 / radius) ** 2
  const outer = (1 + 0.5 / radius) ** 2
  let count = 0
  for (let y = 0; y < size; y += 1) {
    const ny = (centre - y - 0.5) / radius
    for (let x = 0; x < size; x += 1) {
      const nx = (x + 0.5 - centre) / radius
      const squared = nx * nx + ny * ny
      if (squared >= outer || count >= capacity) continue
      const nz = squared >= 1 ? 0 : Math.sqrt(1 - squared)
      const worldZ = nz * cosTilt - ny * sinTilt
      const worldY = ny * cosTilt + nz * sinTilt
      const lat = Math.asin(worldY > 1 ? 1 : worldY < -1 ? -1 : worldY) / RADIANS
      const lng = Math.atan2(nx, worldZ) / RADIANS
      pixels[count] = y * size + x
      rows[count] = Math.min(Math.floor(((90 - lat) / 180) * TEXTURE_HEIGHT), TEXTURE_HEIGHT - 1) * TEXTURE_WIDTH
      columns[count] = Math.floor(((lng + 360) / 360) * TEXTURE_WIDTH)
      const light = nx * LIGHT_X + ny * LIGHT_Y + nz * LIGHT_Z
      facing[count] = light > 0 ? light : 0
      cover[count] = squared <= inner ? 255 : Math.max(Math.min((1 - Math.sqrt(squared)) * radius + 0.5, 1), 0) * 255
      count += 1
    }
  }
  return { key: `${size}|${tiltDegrees}`, pixels: pixels.subarray(0, count), rows: rows.subarray(0, count), columns: columns.subarray(0, count), facing: facing.subarray(0, count), cover: cover.subarray(0, count) }
}

export interface SolidColors {
  ocean: Rgb
  land: Rgb
}

export interface SolidFrame {
  size: number
  pixels: Int32Array
  rows: Int32Array
  columns: Int32Array
  ocean: Uint32Array
  land: Uint32Array
}

/** ImageData bytes run red, green, blue, alpha, which on any little-endian machine packs alpha into the top byte. */
function pack(r: number, g: number, b: number, a: number) {
  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0
}

function shadeInto(target: Uint32Array, { facing, cover }: Geometry, color: Rgb, floor: number) {
  const [r, g, b] = color
  for (let index = 0; index < target.length; index += 1) {
    const light = facing[index] as number
    const squared = light * light
    const fourth = squared * squared
    const sheen = SHEEN * fourth * fourth
    const body = floor + (1 - floor) * light
    const keep = body * (1 - sheen)
    const add = 255 * sheen
    target[index] = pack(r * keep + add, g * keep + add, b * keep + add, cover[index] as number)
  }
}

let lastGeometry: Geometry | null = null

export function buildSolidFrame(size: number, tiltDegrees: number, { ocean, land }: SolidColors): SolidFrame {
  const key = `${size}|${tiltDegrees}`
  const geometry = lastGeometry?.key === key ? lastGeometry : buildGeometry(size, tiltDegrees)
  lastGeometry = geometry
  const oceanPixels = new Uint32Array(geometry.pixels.length)
  const landPixels = new Uint32Array(geometry.pixels.length)
  shadeInto(oceanPixels, geometry, ocean, OCEAN_FLOOR)
  shadeInto(landPixels, geometry, land, LAND_FLOOR)
  return { size, pixels: geometry.pixels, rows: geometry.rows, columns: geometry.columns, ocean: oceanPixels, land: landPixels }
}

function blendPacked(ocean: number, land: number, coverage: number) {
  const inverse = 255 - coverage
  const red = ((ocean & 255) * inverse + (land & 255) * coverage) / 255
  const green = (((ocean >>> 8) & 255) * inverse + ((land >>> 8) & 255) * coverage) / 255
  const blue = (((ocean >>> 16) & 255) * inverse + ((land >>> 16) & 255) * coverage) / 255
  return pack(red, green, blue, ocean >>> 24)
}

/** Writes into the canvas's own pixel buffer: this runs every frame, and an allocation here would be garbage at 60 Hz. */
export function paintSolidFrame(frame: SolidFrame, angle: number, target: Uint32Array, landCoverage = landTexture()) {
  const wrap = TEXTURE_WIDTH - 1
  const shift = Math.round(((angle + 180) / 360) * TEXTURE_WIDTH)
  const { pixels, rows, columns, ocean, land } = frame
  for (let index = 0; index < pixels.length; index += 1) {
    const coverage = landCoverage[(rows[index] as number) + (((columns[index] as number) + shift) & wrap)] as number
    if (coverage === 0) target[pixels[index] as number] = ocean[index] as number
    else if (coverage === 255) target[pixels[index] as number] = land[index] as number
    else target[pixels[index] as number] = blendPacked(ocean[index] as number, land[index] as number, coverage)
  }
}
