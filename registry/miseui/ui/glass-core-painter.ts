import type { MotionValue } from "motion/react"
import { buildKnot, knotAngles, projectKnot } from "@/registry/miseui/ui/glass-core-knot"
import { rasterizeKnot, type KnotShade, type Rgb } from "@/registry/miseui/ui/glass-core-raster"

const BEAD_COUNT = 360
/** Paint cost grows with the area. A smooth tube loses nothing when the browser scales it up the last step. */
const MAX_CANVAS_PX = 400

const MAX_PIXEL_RATIO = 2

/** Canvas parses any CSS colour the theme uses, oklch included, so asking it is shorter than writing a parser. */
function resolveColor(color: string, fallback: Rgb): Rgb {
  const probe = document.createElement("canvas")
  probe.width = 1
  probe.height = 1
  const ctx = probe.getContext("2d", { willReadFrequently: true })
  if (!ctx) return fallback
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}

function readColors(canvas: HTMLCanvasElement) {
  const styles = getComputedStyle(canvas)
  return { surface: styles.getPropertyValue("--background").trim() || "#ffffff", accent: styles.getPropertyValue("--mise").trim() || "#888888" }
}

interface KnotLoopOptions {
  leanX: MotionValue<number>
  leanY: MotionValue<number>
  drift: boolean
  solid: boolean
}

type KnotLean = Pick<KnotLoopOptions, "leanX" | "leanY">

/** Everything that can make a painted knot stale: its size, the page theme, the pointer, and coming back into view. */
function watchKnot(canvas: HTMLCanvasElement, { leanX, leanY }: KnotLean, schedule: () => void, setVisible: (visible: boolean) => void) {
  const resize = new ResizeObserver(schedule)
  resize.observe(canvas)
  const theme = new MutationObserver(schedule)
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] })
  const view = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
    setVisible(entry?.isIntersecting ?? true)
    schedule()
  })
  view?.observe(canvas)
  const offX = leanX.on("change", schedule)
  const offY = leanY.on("change", schedule)
  document.addEventListener("visibilitychange", schedule)
  return () => {
    resize.disconnect()
    theme.disconnect()
    view?.disconnect()
    offX()
    offY()
    document.removeEventListener("visibilitychange", schedule)
  }
}

/**
 * Paints on demand and only runs a frame loop while drifting on screen, so a still knot costs nothing.
 * The theme is read per paint, and the observer on <html> repaints when the page changes theme or accent.
 */
export function startKnotPainter(canvas: HTMLCanvasElement, { leanX, leanY, drift, solid }: KnotLoopOptions) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return () => {}
  const points = buildKnot(BEAD_COUNT)
  let shade: KnotShade | null = null
  let shadeKey = ""
  let frame = 0
  let visible = true
  let startedAt: number | null = null

  const paint = (time: number) => {
    const size = canvas.clientWidth
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
    const pixels = Math.min(Math.round(size * ratio), MAX_CANVAS_PX)
    if (canvas.width !== pixels) canvas.width = pixels
    if (canvas.height !== pixels) canvas.height = pixels
    startedAt ??= time
    const seconds = drift ? (time - startedAt) / 1000 : 0
    const { tilt, turn } = knotAngles(seconds, leanX.get(), leanY.get())
    const colors = readColors(canvas)
    const key = `${colors.surface}|${colors.accent}`
    if (!shade || key !== shadeKey) {
      shade = { accent: resolveColor(colors.accent, [136, 136, 136]), surface: resolveColor(colors.surface, [255, 255, 255]), solid }
      shadeKey = key
    }
    if (pixels <= 0) return
    const image = ctx.createImageData(pixels, pixels)
    rasterizeKnot(projectKnot(points, tilt, turn, pixels), pixels, shade, image.data)
    ctx.putImageData(image, 0, 0)
  }
  const schedule = () => {
    if (frame) return
    frame = requestAnimationFrame((time) => {
      frame = 0
      paint(time)
      if (drift && visible && !document.hidden) schedule()
    })
  }

  const stopWatching = watchKnot(canvas, { leanX, leanY }, schedule, (next) => {
    visible = next
  })
  schedule()

  return () => {
    cancelAnimationFrame(frame)
    stopWatching()
  }
}
