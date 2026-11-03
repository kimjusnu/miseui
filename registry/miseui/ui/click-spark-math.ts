import { seededRandom } from "@/registry/miseui/ui/background-seed"

export type ClickSparkVariant = "spark" | "dots" | "ring" | "confetti"

export interface Particle {
  angle: number
  speed: number
  size: number
  /** 0, 1 or 2: which of the three accent neighbours it is. */
  tone: number
  spin: number
}

export interface Burst {
  variant: ClickSparkVariant
  x: number
  y: number
  startedAt: number
  life: number
  particles: readonly Particle[]
}

export const DEFAULT_COUNT: Record<ClickSparkVariant, number> = { spark: 8, dots: 10, ring: 1, confetti: 10 }
/** Long enough to read as a burst, short enough to be gone by the next press. */
export const LIFE_MS: Record<ClickSparkVariant, number> = { spark: 380, dots: 600, ring: 520, confetti: 900 }
/** The furthest anything travels from the press, so the canvas knows how much room to keep. */
export const REACH_PX = 72

/** A ring is one band however many are asked for. */
export function createBurst(variant: ClickSparkVariant, x: number, y: number, startedAt: number, count: number, seed: number): Burst {
  const random = seededRandom(seed)
  const total = variant === "ring" ? 1 : Math.max(1, Math.round(count))
  const particles = Array.from({ length: total }, (_, index) => ({
    // Evenly round the circle with a little jitter, so a small count never leaves a visible gap.
    angle: (index / total) * Math.PI * 2 + (random() - 0.5) * 0.5,
    speed: 0.75 + random() * 0.25,
    size: 0.8 + random() * 0.4,
    tone: Math.floor(random() * 3),
    spin: (random() - 0.5) * 8,
  }))
  return { variant, x, y, startedAt, life: LIFE_MS[variant], particles }
}

const easeOutCubic = (value: number) => 1 - (1 - value) ** 3
const clampUnit = (value: number) => Math.min(1, Math.max(0, value))

export function burstProgress(burst: Burst, now: number) {
  return clampUnit((now - burst.startedAt) / burst.life)
}

/** Both ends of the line in closed form: a line that flies out and shortens, rather than one that fades. */
export function sparkLine(particle: Particle, progress: number) {
  const eased = easeOutCubic(progress)
  const head = (10 + 26 * eased) * particle.speed
  const length = 12 * (1 - progress) * particle.size
  return { from: head, to: head + length }
}

/** Thrown outward, then pulled down a little. Light gravity is what makes the bits feel like they have weight. */
export function dotPosition(particle: Particle, progress: number) {
  const distance = 36 * easeOutCubic(progress) * particle.speed
  return {
    x: Math.cos(particle.angle) * distance,
    y: Math.sin(particle.angle) * distance + 22 * progress * progress,
    radius: 2.5 * particle.size * (1 - progress * 0.6),
    alpha: 1 - progress ** 3,
  }
}

export function ringBand(progress: number) {
  const eased = easeOutCubic(progress)
  return { radius: 8 + 40 * eased, alpha: (1 - progress) ** 2 }
}

/** Up and out at first, then falling, tumbling as it goes. */
export function confettiPiece(particle: Particle, progress: number) {
  const eased = easeOutCubic(Math.min(1, progress * 1.6))
  const distance = 34 * eased * particle.speed
  return {
    x: Math.cos(particle.angle) * distance,
    y: Math.sin(particle.angle) * distance - 10 * eased + 46 * progress * progress,
    rotation: particle.spin * progress,
    alpha: progress < 0.7 ? 1 : (1 - progress) / 0.3,
  }
}

export interface CanvasRect {
  left: number
  top: number
  width: number
  height: number
}

/**
 * The room around the wrapper, kept inside the page: a canvas sticking out past the right or bottom edge of the
 * document would widen it or add a scrollbar. Left and top cannot do that.
 */
export function canvasRect(width: number, height: number, roomRight: number, roomBottom: number, reach = REACH_PX): CanvasRect {
  const right = Math.min(reach, Math.max(0, roomRight))
  const bottom = Math.min(reach, Math.max(0, roomBottom))
  return { left: -reach, top: -reach, width: width + reach + right, height: height + reach + bottom }
}
