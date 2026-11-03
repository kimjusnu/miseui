import { seedParticles, type ParticleField, type ParticleVariant, type PointerAt } from "@/registry/miseui/ui/particles-background-engine"
import { createLinkBuffer, LINK_ALPHAS, linkDistance, linkParticles, SHADES, shadeOf, type LinkBuffer } from "@/registry/miseui/ui/particles-background-links"
import { resizeParticles, stepParticles } from "@/registry/miseui/ui/particles-background-step"

const MAX_PIXEL_RATIO = 2
/** A long gap, such as coming back from another tab, must not teleport anything. */
const MAX_STEP_SECONDS = 0.05
const FALLBACK = { accent: "#888888", neutral: "#888888" }

export interface ParticleColors {
  accent: string
  neutral: string
}

/** The canvas carries both tokens as `color` and `border-color`, so the browser resolves relative colours for us. */
export function readParticleColors(canvas: HTMLCanvasElement): ParticleColors {
  const styles = getComputedStyle(canvas)
  return { accent: styles.color || FALLBACK.accent, neutral: styles.borderTopColor || FALLBACK.neutral }
}

interface Scene {
  field: ParticleField | null
  links: LinkBuffer | null
  distance: number
  colors: ParticleColors
}

function paintPoints(ctx: CanvasRenderingContext2D, field: ParticleField, colors: ParticleColors) {
  SHADES[field.variant].forEach((shade, level) => {
    ctx.beginPath()
    for (let i = 0; i < field.count; i += 1) {
      if (shadeOf(field, i) !== level) continue
      const x = field.x[i] as number
      const y = field.y[i] as number
      const radius = field.size[i] as number
      ctx.moveTo(x + radius, y)
      ctx.arc(x, y, radius, 0, Math.PI * 2)
    }
    ctx.globalAlpha = shade.alpha
    ctx.fillStyle = colors[shade.tone]
    ctx.fill()
  })
}

function paintLinks(ctx: CanvasRenderingContext2D, field: ParticleField, links: LinkBuffer, colors: ParticleColors) {
  ctx.lineWidth = 1
  ctx.strokeStyle = colors.neutral
  LINK_ALPHAS.forEach((alpha, level) => {
    ctx.beginPath()
    for (let n = 0; n < links.count; n += 1) {
      if (links.level[n] !== level) continue
      const a = links.a[n] as number
      const b = links.b[n] as number
      ctx.moveTo(field.x[a] as number, field.y[a] as number)
      ctx.lineTo(field.x[b] as number, field.y[b] as number)
    }
    ctx.globalAlpha = alpha
    ctx.stroke()
  })
}

function paintScene(ctx: CanvasRenderingContext2D, { field, links, colors }: Scene) {
  if (!field) return
  ctx.clearRect(0, 0, field.width, field.height)
  if (links) paintLinks(ctx, field, links, colors)
  paintPoints(ctx, field, colors)
}

/**
 * Matches the canvas to its box. Returns false when nothing changed: the observer also fires once on observe, and
 * assigning canvas.width wipes it.
 */
function fitScene(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, scene: Scene, { variant, seed }: PainterOptions) {
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  if (width <= 0 || height <= 0 || (scene.field?.width === width && scene.field.height === height)) return false
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  scene.field = scene.field ? resizeParticles(scene.field, width, height, seed) : seedParticles(variant, width, height, seed)
  if (variant === "constellation") {
    scene.distance = linkDistance(width, height, scene.field.count)
    scene.links = createLinkBuffer(scene.field, scene.distance)
    linkParticles(scene.field, scene.links, scene.distance)
  }
  return true
}

function stepScene({ field, links, distance }: Scene, dt: number, pointer: PointerAt | null) {
  if (!field) return false
  const moved = stepParticles(field, dt, pointer)
  if (links) linkParticles(field, links, distance, pointer !== null)
  return moved
}

function watchTheme(onChange: () => void) {
  const theme = new MutationObserver(onChange)
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme", "data-palette"] })
  const scheme = window.matchMedia("(prefers-color-scheme: dark)")
  scheme.addEventListener("change", onChange)
  return () => {
    theme.disconnect()
    scheme.removeEventListener("change", onChange)
  }
}

/** One outstanding frame at a time. The callback says whether it wants another. */
function createFrameLoop(onFrame: (time: number) => boolean) {
  let frame = 0
  const request = () => {
    if (frame) return
    frame = requestAnimationFrame((time) => {
      frame = 0
      if (onFrame(time)) request()
    })
  }
  const cancel = () => {
    if (frame) cancelAnimationFrame(frame)
    frame = 0
  }
  return { request, cancel }
}

export interface ParticlePainter {
  setPlaying: (playing: boolean) => void
  /** Client coordinates, or null when the pointer left. */
  setPointer: (client: { x: number; y: number } | null) => void
  stop: () => void
}

interface PainterOptions {
  variant: ParticleVariant
  seed: number
}

const NOOP_PAINTER: ParticlePainter = { setPlaying: () => {}, setPointer: () => {}, stop: () => {} }

function pointerInBox(canvas: HTMLCanvasElement, client: { x: number; y: number } | null): PointerAt | null {
  if (!client) return null
  const box = canvas.getBoundingClientRect()
  return { x: client.x - box.left, y: client.y - box.top }
}

/** One canvas, one loop. Frames run only while playing, and a settled field stops asking for them. */
export function startParticlePainter(canvas: HTMLCanvasElement, options: PainterOptions): ParticlePainter {
  const ctx = canvas.getContext("2d")
  if (!ctx) return NOOP_PAINTER
  const scene: Scene = { field: null, links: null, distance: 0, colors: readParticleColors(canvas) }
  let playing = false
  let client: { x: number; y: number } | null = null
  let lastTime: number | null = null

  const loop = createFrameLoop((time) => {
    if (!playing) return false
    const dt = lastTime === null ? 0 : Math.min(MAX_STEP_SECONDS, (time - lastTime) / 1000)
    lastTime = time
    const moved = stepScene(scene, dt, pointerInBox(canvas, client))
    paintScene(ctx, scene)
    // A first frame has no time step, so a resting field cannot tell yet whether it has settled.
    return moved || dt === 0
  })
  const refit = () => {
    if (!fitScene(canvas, ctx, scene, options)) return
    paintScene(ctx, scene)
    if (playing) loop.request()
  }
  const size = new ResizeObserver(refit)
  size.observe(canvas)
  const stopTheme = watchTheme(() => {
    scene.colors = readParticleColors(canvas)
    paintScene(ctx, scene)
  })
  refit()

  return {
    setPlaying: (next) => {
      playing = next
      lastTime = null
      if (next) loop.request()
      else loop.cancel()
    },
    setPointer: (next) => {
      client = next
      if (playing) loop.request()
    },
    stop: () => {
      playing = false
      loop.cancel()
      size.disconnect()
      stopTheme()
    },
  }
}
