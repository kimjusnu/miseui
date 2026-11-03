import { between, seededRandom } from "@/registry/miseui/ui/background-seed"

const MIN_SOURCE_GAP = 26
const PLACEMENT_TRIES = 24

export interface Ring {
  /** Diameter in percent of the box's longer side. */
  size: number
  opacity: number
}

/**
 * The gaps widen on the way out, as a real ripple's do, which is what stops it reading as a target.
 * Opacity falls with distance, so the outer ring is already near nothing when the mask takes over.
 */
export function ringLayout(count: number, minSize: number, maxSize: number, peak: number): readonly Ring[] {
  return Array.from({ length: count }, (_, index) => {
    const position = count > 1 ? index / (count - 1) : 0
    return {
      size: Math.round((minSize + (maxSize - minSize) * position ** 1.25) * 100) / 100,
      opacity: Math.round(peak * (1 - position * 0.8) * 1000) / 1000,
    }
  })
}

export interface Wave {
  /** Scale of the frozen frame, so the still picture looks like the moving one. */
  stillScale: number
  stillOpacity: number
  delay: number
}

/** Evenly staggered: a ring leaves as another is halfway out. Negative delays mean the first frame is already full. */
export function waveLayout(count: number, seconds: number, peak: number): readonly Wave[] {
  return Array.from({ length: count }, (_, index) => {
    const position = (index + 0.6) / count
    return {
      stillScale: Math.round(position * 100) / 100,
      stillOpacity: Math.round(peak * (1 - position) * 1000) / 1000,
      delay: -Math.round((position * seconds * 100)) / 100,
    }
  })
}

export interface Source {
  left: number
  top: number
  seconds: number
}

/** Seeded places kept apart and away from the edge. Falls back to the last try so it always returns `count`. */
export function pondSources(seed: number, count: number): readonly Source[] {
  const random = seededRandom(seed)
  return Array.from({ length: count }).reduce<readonly Source[]>((placed) => {
    const candidate = (): Source => ({ left: between(random, 14, 86), top: between(random, 16, 84), seconds: between(random, 11, 16) })
    const clear = (source: Source) => placed.every((other) => Math.hypot(other.left - source.left, other.top - source.top) >= MIN_SOURCE_GAP)
    const tries = Array.from({ length: PLACEMENT_TRIES }, candidate)
    const chosen = tries.find(clear) ?? (tries[tries.length - 1] as Source)
    return [...placed, chosen]
  }, [])
}

export interface PressRing {
  id: number
  x: number
  y: number
}

const MAX_PRESS_RINGS = 6

/** Oldest goes first, so a fast tapper cannot pile up elements if an animation end never arrives in a hidden tab. */
export function addPressRing(rings: readonly PressRing[], ring: PressRing): readonly PressRing[] {
  return [...rings, ring].slice(-MAX_PRESS_RINGS)
}
