import { readInk, watchTheme, type Ink } from "@/registry/miseui/ui/globe-color"
import { buildGraticule, drawArcs, drawMarkers, type Disc } from "@/registry/miseui/ui/globe-draw"
import { DotCache, paintVector, solidBuffer, type GlobeVariant, type SolidBuffer } from "@/registry/miseui/ui/globe-frame"
import { createView, dragDegrees, greatCirclePoints, normalizeDegrees, SPIN_DEGREES_PER_SECOND, stepSpin, type GlobePoint, type Spin } from "@/registry/miseui/ui/globe-math"
import { paintSolidFrame } from "@/registry/miseui/ui/globe-solid"

export type { GlobeVariant }

export interface GlobeScene {
  variant: GlobeVariant
  center: GlobePoint
  markers: readonly GlobePoint[]
  arcs: readonly { from: GlobePoint; to: GlobePoint }[]
}

const MAX_PIXEL_RATIO = 2
/** Per-pixel shading scales with area, and a smooth ball loses nothing when the browser enlarges the last step. */
const MAX_SOLID_PIXELS = 720
const ARC_SEGMENTS = 64
const ARC_LIFT = 0.12
/** Lifted arcs need room past the rim, or the canvas edge would cut them straight. */
const ARCS_DISC_SHARE = 0.88
const IDLE_VELOCITY = 0.05
const FLICK_STALE_MS = 80
const MAX_FLICK = 360
const KEY_EASE_SECONDS = 0.12
/** The slow turn moves under half a pixel per step at this rate, so painting it at 60 Hz would only spend battery. */
const AUTO_FRAME_MS = 32

export interface GlobePainter {
  setScene: (scene: GlobeScene) => void
  /** Whether the slow turn runs. False off screen, in a hidden tab, when paused and under reduced motion. */
  setAuto: (auto: boolean) => void
  /** Under reduced motion a drag still turns the globe, one to one, and a key press lands at once. */
  setStill: (still: boolean) => void
  dragBy: (pixels: number, timeMs: number) => void
  release: (timeMs: number) => void
  turnBy: (degrees: number) => void
  destroy: () => void
}

const NO_PAINTER: GlobePainter = { setScene: () => {}, setAuto: () => {}, setStill: () => {}, dragBy: () => {}, release: () => {}, turnBy: () => {}, destroy: () => {} }

/**
 * Paints on demand. Frames run only while something moves: the slow turn, a flick dying away, or a key press landing.
 * Spin lives here rather than in React, because a pointer stream must not re-render anything.
 */
export function createGlobePainter(canvas: HTMLCanvasElement, firstScene: GlobeScene): GlobePainter {
  const ctx = canvas.getContext("2d")
  if (!ctx) return NO_PAINTER
  const dots = new DotCache()
  const graticule = buildGraticule()
  let scene = firstScene
  let spin: Spin = { angle: firstScene.center.lng, velocity: 0 }
  let arcLines = firstScene.arcs.map(({ from, to }) => greatCirclePoints(from, to, ARC_SEGMENTS, ARC_LIFT))
  let ink: Ink | null = null
  let solid: SolidBuffer | null = null
  let auto = false
  let still = false
  let dragging = false
  let lastMoveAt = 0
  let keyTurn = 0
  let lightSeconds = 0
  let frame = 0
  let lastStep = 0
  let lastPaint = 0

  const paint = () => {
    const cssSize = canvas.clientWidth
    if (cssSize <= 0) return
    const wanted = Math.round(cssSize * Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO))
    const pixels = scene.variant === "solid" ? Math.min(wanted, MAX_SOLID_PIXELS) : wanted
    if (canvas.width !== pixels) canvas.width = pixels
    if (canvas.height !== pixels) canvas.height = pixels
    ink ??= readInk(canvas)
    const disc: Disc = { cx: pixels / 2, cy: pixels / 2, radius: (pixels / 2 - 1) * (scene.variant === "arcs" ? ARCS_DISC_SHARE : 1), ratio: pixels / cssSize }
    const view = createView(spin.angle, scene.center.lat)
    if (scene.variant === "solid") {
      solid = solidBuffer(ctx, solid, pixels, scene.center.lat, ink)
      paintSolidFrame(solid.frame, spin.angle, solid.target)
      ctx.putImageData(solid.image, 0, 0)
    } else paintVector(ctx, scene.variant, view, disc, ink, dots, graticule)
    if (scene.variant === "arcs") drawArcs(ctx, { lines: arcLines, lightSeconds: still ? null : lightSeconds }, view, disc, ink.accent)
    drawMarkers(ctx, scene.markers, view, disc, ink.accent, scene.variant === "solid" ? ink.ocean : ink.surface)
  }

  const isSettling = () => Math.abs(spin.velocity - (auto ? -SPIN_DEGREES_PER_SECOND : 0)) > IDLE_VELOCITY || Math.abs(keyTurn) > IDLE_VELOCITY
  const schedule = () => {
    if (frame === 0) frame = requestAnimationFrame(tick)
  }
  const advance = (seconds: number) => {
    if (keyTurn !== 0) {
      const moved = Math.abs(keyTurn) <= IDLE_VELOCITY ? keyTurn : keyTurn * (1 - Math.exp(-seconds / KEY_EASE_SECONDS))
      spin = { angle: normalizeDegrees(spin.angle + moved), velocity: 0 }
      keyTurn -= moved
      return
    }
    if (dragging) return
    spin = stepSpin(spin, auto ? -SPIN_DEGREES_PER_SECOND : 0, seconds)
    if (auto) lightSeconds += seconds
  }
  function tick(now: number) {
    frame = 0
    const settling = isSettling() || dragging
    if (!settling && auto && now - lastPaint < AUTO_FRAME_MS) {
      schedule()
      return
    }
    const seconds = lastStep === 0 ? 0 : Math.min((now - lastStep) / 1000, 0.05)
    lastStep = now
    lastPaint = now
    advance(seconds)
    paint()
    // A held drag paints from its own pointer events. Looping here would only redraw the same frame.
    if (!dragging && (auto || isSettling())) schedule()
    else lastStep = 0
  }

  const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule)
  resize?.observe(canvas)
  const stopTheme = watchTheme(() => {
    ink = null
    schedule()
  })
  schedule()

  return {
    setScene: (next) => {
      if (next.center.lat !== scene.center.lat || next.center.lng !== scene.center.lng) spin = { angle: next.center.lng, velocity: spin.velocity }
      scene = next
      arcLines = next.arcs.map(({ from, to }) => greatCirclePoints(from, to, ARC_SEGMENTS, ARC_LIFT))
      schedule()
    },
    setAuto: (next) => {
      auto = next
      schedule()
    },
    setStill: (next) => {
      still = next
      schedule()
    },
    dragBy: (pixels, timeMs) => {
      const degrees = dragDegrees(pixels, canvas.clientWidth / 2)
      const elapsed = Math.max(timeMs - lastMoveAt, 1) / 1000
      dragging = true
      keyTurn = 0
      lastMoveAt = timeMs
      spin = { angle: normalizeDegrees(spin.angle + degrees), velocity: spin.velocity * 0.6 + (degrees / elapsed) * 0.4 }
      schedule()
    },
    release: (timeMs) => {
      dragging = false
      const fresh = timeMs - lastMoveAt < FLICK_STALE_MS && !still
      spin = { angle: spin.angle, velocity: fresh ? Math.min(Math.max(spin.velocity, -MAX_FLICK), MAX_FLICK) : 0 }
      schedule()
    },
    turnBy: (degrees) => {
      if (still) spin = { angle: normalizeDegrees(spin.angle + degrees), velocity: 0 }
      else keyTurn += degrees
      schedule()
    },
    destroy: () => {
      cancelAnimationFrame(frame)
      resize?.disconnect()
      stopTheme()
    },
  }
}
