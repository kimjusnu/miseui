import { isArcPointVisible, projectDots, rotatePoint, toUnitVector, type GlobePoint, type GlobeView } from "@/registry/miseui/ui/globe-math"
import type { Rgb } from "@/registry/miseui/ui/globe-color"

export interface Disc {
  cx: number
  cy: number
  radius: number
  /** Backing pixels per CSS pixel, so marks keep their size on any screen. */
  ratio: number
}

const css = ([r, g, b]: Rgb, alpha: number) => `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)} / ${alpha})`

/**
 * Depth under an orthographic view depends only on the distance from the centre, so one radial gradient as the fill of
 * one path fades every dot toward the rim. Buckets of dots per opacity would need a path each and show as rings.
 */
export function limbFill(ctx: CanvasRenderingContext2D, { cx, cy, radius }: Disc, color: Rgb, peak: number) {
  const fill = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
  fill.addColorStop(0, css(color, peak))
  fill.addColorStop(0.7, css(color, peak))
  fill.addColorStop(0.9, css(color, peak * 0.72))
  fill.addColorStop(1, css(color, peak * 0.18))
  return fill
}

/** The rim is a little denser than the middle, as on any ball seen against a flat page. It is what turns a cloud of dots into a sphere. */
export function drawHaze(ctx: CanvasRenderingContext2D, { cx, cy, radius }: Disc, color: Rgb) {
  const fill = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
  fill.addColorStop(0, css(color, 0))
  fill.addColorStop(0.5, css(color, 0.008))
  fill.addColorStop(0.8, css(color, 0.036))
  fill.addColorStop(1, css(color, 0.078))
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
}

export function drawDots(ctx: CanvasRenderingContext2D, units: Float32Array, scratch: Float32Array, view: GlobeView, disc: Disc, dotRadius: number, fill: CanvasGradient) {
  const count = projectDots(units, view, scratch)
  ctx.fillStyle = fill
  ctx.beginPath()
  for (let index = 0; index < count; index += 1) {
    const x = disc.cx + (scratch[index * 3] as number) * disc.radius
    const y = disc.cy - (scratch[index * 3 + 1] as number) * disc.radius
    // Round dots seen edge-on get narrower. Shrinking them is the cheap stand-in for an ellipse per dot.
    const size = dotRadius * (0.55 + 0.45 * (scratch[index * 3 + 2] as number))
    ctx.moveTo(x + size, y)
    ctx.arc(x, y, size, 0, Math.PI * 2)
  }
  ctx.fill()
  return count
}

const GRATICULE_STEP = 30
const LINE_SEGMENTS = 48

/** Flat x, y, z polylines. The poles get no parallel: a circle of radius zero only draws a dot. */
export function buildGraticule() {
  const lines: Float32Array[] = []
  const trace = (at: (share: number) => GlobePoint) => {
    const line = new Float32Array((LINE_SEGMENTS + 1) * 3)
    for (let step = 0; step <= LINE_SEGMENTS; step += 1) line.set(toUnitVector(at(step / LINE_SEGMENTS)), step * 3)
    lines.push(line)
  }
  for (let lng = -180; lng < 180; lng += GRATICULE_STEP) trace((share) => ({ lat: share * 180 - 90, lng }))
  for (let lat = -60; lat <= 60; lat += GRATICULE_STEP) trace((share) => ({ lat, lng: share * 360 - 180 }))
  return lines
}

/** Adds the kept stretches of a polyline to the current path. A gap breaks the line rather than joining across the disc. */
function tracePolyline(ctx: CanvasRenderingContext2D, line: Float32Array, view: GlobeView, disc: Disc, keep: (x: number, y: number, z: number) => boolean) {
  let drawing = false
  for (let index = 0; index < line.length; index += 3) {
    const [x, y, z] = rotatePoint(line[index] as number, line[index + 1] as number, line[index + 2] as number, view)
    if (!keep(x, y, z)) {
      drawing = false
      continue
    }
    const screenX = disc.cx + x * disc.radius
    const screenY = disc.cy - y * disc.radius
    if (drawing) ctx.lineTo(screenX, screenY)
    else ctx.moveTo(screenX, screenY)
    drawing = true
  }
}

const isNear = (_x: number, _y: number, z: number) => z > 0
const isFar = (_x: number, _y: number, z: number) => z <= 0

/** The far side shows through very faintly: that is the whole difference between a wire ball and a printed circle. */
export function drawGraticule(ctx: CanvasRenderingContext2D, lines: readonly Float32Array[], view: GlobeView, disc: Disc, color: Rgb) {
  ctx.lineWidth = disc.ratio * 0.75
  ctx.strokeStyle = css(color, 0.06)
  ctx.beginPath()
  lines.forEach((line) => tracePolyline(ctx, line, view, disc, isFar))
  ctx.stroke()
  ctx.strokeStyle = css(color, 0.15)
  ctx.beginPath()
  lines.forEach((line) => tracePolyline(ctx, line, view, disc, isNear))
  ctx.stroke()
  ctx.strokeStyle = css(color, 0.22)
  ctx.beginPath()
  ctx.arc(disc.cx, disc.cy, disc.radius, 0, Math.PI * 2)
  ctx.stroke()
}

const MARKER_FADE_DEPTH = 0.22

export function drawMarkers(ctx: CanvasRenderingContext2D, markers: readonly GlobePoint[], view: GlobeView, disc: Disc, accent: Rgb, surface: Rgb) {
  markers.forEach((marker) => {
    const unit = toUnitVector(marker)
    const [x, y, z] = rotatePoint(unit[0], unit[1], unit[2], view)
    if (z <= 0) return
    const alpha = Math.min(z / MARKER_FADE_DEPTH, 1)
    const px = disc.cx + x * disc.radius
    const py = disc.cy - y * disc.radius
    const circle = (radius: number, color: string) => {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(px, py, radius * disc.ratio, 0, Math.PI * 2)
      ctx.fill()
    }
    circle(8, css(accent, 0.22 * alpha))
    circle(4.5, css(surface, alpha))
    circle(3, css(accent, alpha))
  })
}

const isArcVisible = (x: number, y: number, z: number) => isArcPointVisible(x, y, z)
const LIGHT_TAIL = 0.24
const LIGHT_SHARE = 0.72

/** Stays inside one stroke: a tail of short segments in rising alpha would show a bead at every joint. */
function drawLight(ctx: CanvasRenderingContext2D, line: Float32Array, phase: number, view: GlobeView, disc: Disc, accent: Rgb) {
  if (phase > LIGHT_SHARE) return
  const pointCount = line.length / 3
  const travel = phase / LIGHT_SHARE
  const head = Math.round(travel * (1 + LIGHT_TAIL) * (pointCount - 1))
  const tail = Math.max(head - Math.round(LIGHT_TAIL * (pointCount - 1)), 0)
  const end = Math.min(head, pointCount - 1)
  if (end <= tail) return
  const screen = (at: number) => {
    const [x, y, z] = rotatePoint(line[at * 3] as number, line[at * 3 + 1] as number, line[at * 3 + 2] as number, view)
    return { x: disc.cx + x * disc.radius, y: disc.cy - y * disc.radius, shown: isArcPointVisible(x, y, z) }
  }
  const from = screen(tail)
  const to = screen(end)
  const fill = ctx.createLinearGradient(from.x, from.y, to.x, to.y)
  fill.addColorStop(0, css(accent, 0))
  fill.addColorStop(1, css(accent, 1))
  ctx.strokeStyle = fill
  ctx.lineWidth = disc.ratio * 1.75
  ctx.lineCap = "round"
  ctx.beginPath()
  tracePolyline(ctx, line.subarray(tail * 3, (end + 1) * 3), view, disc, isArcVisible)
  ctx.stroke()
  if (!to.shown || head > pointCount - 1) return
  ctx.fillStyle = css(accent, 1)
  ctx.beginPath()
  ctx.arc(to.x, to.y, disc.ratio * 1.75, 0, Math.PI * 2)
  ctx.fill()
}

interface ArcPaint {
  lines: readonly Float32Array[]
  /** Seconds of light travel, or null for a still frame: the arc alone says where it runs. */
  lightSeconds: number | null
}

const LIGHT_PERIOD_SECONDS = 4.2

export function drawArcs(ctx: CanvasRenderingContext2D, { lines, lightSeconds }: ArcPaint, view: GlobeView, disc: Disc, accent: Rgb) {
  ctx.lineWidth = disc.ratio
  ctx.strokeStyle = css(accent, lightSeconds === null ? 0.85 : 0.38)
  ctx.beginPath()
  lines.forEach((line) => tracePolyline(ctx, line, view, disc, isArcVisible))
  ctx.stroke()
  if (lightSeconds === null) return
  lines.forEach((line, index) => {
    const phase = (lightSeconds / LIGHT_PERIOD_SECONDS + index / Math.max(lines.length, 1)) % 1
    drawLight(ctx, line, phase, view, disc, accent)
  })
}
