import {
  burstProgress,
  canvasRect,
  confettiPiece,
  createBurst,
  dotPosition,
  ringBand,
  sparkLine,
  type Burst,
  type ClickSparkVariant,
} from "@/registry/miseui/ui/click-spark-math"

/** Rapid pressing should not stack up cost. */
const MAX_BURSTS = 8
const MAX_DPR = 2
/** Wide to narrow, each adding a little: a soft band with no hard line, redrawn at each radius so it never breaks into dashes. */
const RING_STROKES: readonly (readonly [number, number])[] = [
  [16, 0.1],
  [11, 0.14],
  [7, 0.18],
  [3, 0.24],
]

/** A near-black accent would vanish on a dark page, so the light is kept in a lightness band per theme. Neighbours walk away from hue 100. */
const CANVAS_CLASS = [
  "pointer-events-none absolute z-10",
  "[--mise-spark-0:var(--mise)] [--mise-spark-1:var(--mise)] [--mise-spark-2:var(--mise)]",
  "supports-[color:oklch(from_red_l_c_h)]:[--mise-spark-0:oklch(from_var(--mise)_clamp(0.55,l,0.76)_c_h)]",
  "supports-[color:oklch(from_red_l_c_h)]:[--mise-spark-1:oklch(from_var(--mise)_clamp(0.55,l,0.76)_c_calc(h_+_36_*_sin((h_-_100)_*_1deg)))]",
  "supports-[color:oklch(from_red_l_c_h)]:[--mise-spark-2:oklch(from_var(--mise)_clamp(0.6,l,0.8)_c_calc(h_+_72_*_sin((h_-_100)_*_1deg)))]",
  "dark:supports-[color:oklch(from_red_l_c_h)]:[--mise-spark-0:oklch(from_var(--mise)_clamp(0.66,l,0.84)_c_h)]",
  "dark:supports-[color:oklch(from_red_l_c_h)]:[--mise-spark-1:oklch(from_var(--mise)_clamp(0.66,l,0.84)_c_calc(h_+_36_*_sin((h_-_100)_*_1deg)))]",
  "dark:supports-[color:oklch(from_red_l_c_h)]:[--mise-spark-2:oklch(from_var(--mise)_clamp(0.7,l,0.86)_c_calc(h_+_72_*_sin((h_-_100)_*_1deg)))]",
].join(" ")

function resolveTones(canvas: HTMLCanvasElement): readonly string[] {
  return [0, 1, 2].map((tone) => {
    canvas.style.color = `var(--mise-spark-${tone})`
    return getComputedStyle(canvas).color
  })
}

function drawBurst(context: CanvasRenderingContext2D, burst: Burst, progress: number, tones: readonly string[]) {
  const tone = tones[0] ?? "currentColor"
  context.fillStyle = tone
  context.strokeStyle = tone
  if (burst.variant === "ring") {
    const { radius, alpha } = ringBand(progress)
    RING_STROKES.forEach(([width, strength]) => {
      context.globalAlpha = strength * alpha
      context.lineWidth = width
      context.beginPath()
      context.arc(burst.x, burst.y, radius, 0, Math.PI * 2)
      context.stroke()
    })
    return
  }
  burst.particles.forEach((particle) => drawParticle(context, burst, particle, progress, tones))
}

function drawParticle(context: CanvasRenderingContext2D, burst: Burst, particle: Burst["particles"][number], progress: number, tones: readonly string[]) {
  if (burst.variant === "spark") {
    const { from, to } = sparkLine(particle, progress)
    const cos = Math.cos(particle.angle)
    const sin = Math.sin(particle.angle)
    context.globalAlpha = 1
    context.lineWidth = 1.75
    context.lineCap = "round"
    context.beginPath()
    context.moveTo(burst.x + cos * from, burst.y + sin * from)
    context.lineTo(burst.x + cos * to, burst.y + sin * to)
    context.stroke()
  } else if (burst.variant === "dots") {
    const { x, y, radius, alpha } = dotPosition(particle, progress)
    context.globalAlpha = alpha
    context.beginPath()
    context.arc(burst.x + x, burst.y + y, radius, 0, Math.PI * 2)
    context.fill()
  } else {
    const { x, y, rotation, alpha } = confettiPiece(particle, progress)
    const width = 5 * particle.size
    const height = 3 * particle.size
    context.globalAlpha = alpha
    context.fillStyle = tones[particle.tone] ?? tones[0] ?? "currentColor"
    context.save()
    context.translate(burst.x + x, burst.y + y)
    context.rotate(rotation)
    context.fillRect(-width / 2, -height / 2, width, height)
    context.restore()
  }
}

export interface SparkEngine {
  burst: (clientX: number, clientY: number, variant: ClickSparkVariant, count: number) => void
  dispose: () => void
}

function createCanvas(root: HTMLElement) {
  const canvas = document.createElement("canvas")
  canvas.setAttribute("aria-hidden", "true")
  canvas.dataset.slot = "click-spark-canvas"
  canvas.className = CANVAS_CLASS
  root.appendChild(canvas)
  return canvas
}

/** Returns the device pixel scale the bitmap was sized to. */
function fitCanvas(canvas: HTMLCanvasElement, root: HTMLElement) {
  const box = root.getBoundingClientRect()
  const page = document.documentElement
  const rect = canvasRect(box.width, box.height, page.clientWidth - box.right, page.scrollHeight - window.scrollY - box.bottom)
  const scale = Math.min(window.devicePixelRatio || 1, MAX_DPR)
  canvas.style.left = `${rect.left}px`
  canvas.style.top = `${rect.top}px`
  canvas.style.width = `${rect.width}px`
  canvas.style.height = `${rect.height}px`
  canvas.width = Math.round(rect.width * scale)
  canvas.height = Math.round(rect.height * scale)
  return scale
}

/** The canvas is created on the first press and only ever draws while something is alive. */
export function createSparkEngine(root: HTMLElement): SparkEngine {
  const state = {
    canvas: null as HTMLCanvasElement | null,
    context: null as CanvasRenderingContext2D | null,
    observer: null as ResizeObserver | null,
    tones: [] as readonly string[],
    bursts: [] as readonly Burst[],
    frame: 0,
    seed: 1,
    scale: 1,
  }

  const fit = () => {
    if (state.canvas) state.scale = fitCanvas(state.canvas, root)
  }

  const draw = (now: number) => {
    const { context, canvas } = state
    state.frame = 0
    if (!context || !canvas) return
    state.bursts = state.bursts.filter((burst) => now - burst.startedAt < burst.life)
    context.setTransform(state.scale, 0, 0, state.scale, 0, 0)
    context.clearRect(0, 0, canvas.width, canvas.height)
    state.bursts.forEach((burst) => drawBurst(context, burst, burstProgress(burst, now), state.tones))
    if (state.bursts.length > 0) {
      state.frame = requestAnimationFrame(draw)
      return
    }
    // Nothing alive: no loop and no bitmap held for a wrapper that may cover a whole section.
    canvas.width = 0
    canvas.height = 0
  }

  const burst = (clientX: number, clientY: number, variant: ClickSparkVariant, count: number) => {
    if (!state.canvas) {
      state.canvas = createCanvas(root)
      state.context = state.canvas.getContext("2d")
      // Only while something is on it. At rest the backing store is released, and the next press measures again.
      state.observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => state.bursts.length > 0 && fit())
      state.observer?.observe(root)
    }
    if (!state.context) return
    if (state.bursts.length === 0) fit()
    state.tones = resolveTones(state.canvas)
    const box = state.canvas.getBoundingClientRect()
    state.bursts = [...state.bursts, createBurst(variant, clientX - box.left, clientY - box.top, performance.now(), count, state.seed)].slice(-MAX_BURSTS)
    state.seed += 1
    if (state.frame === 0) state.frame = requestAnimationFrame(draw)
  }

  const dispose = () => {
    if (state.frame !== 0) cancelAnimationFrame(state.frame)
    state.frame = 0
    state.observer?.disconnect()
    state.canvas?.remove()
    state.canvas = null
    state.context = null
    state.bursts = []
  }

  return { burst, dispose }
}
