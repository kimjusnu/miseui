import { seededRandom } from "@/registry/miseui/ui/background-seed"

export type ParticleVariant = "drift" | "constellation" | "rise" | "field"

/**
 * The state is typed arrays changed in place, against the usual rule in this code base. This runs at 60 fps, and fresh
 * objects per frame are what produce collection pauses in an animation. Nothing outside the painter holds a reference.
 */
export interface ParticleField {
  variant: ParticleVariant
  width: number
  height: number
  count: number
  /** One slot past `count` holds the pointer, so a link can end there without a special case. */
  x: Float32Array
  y: Float32Array
  vx: Float32Array
  vy: Float32Array
  size: Float32Array
  phase: Float32Array
  /** rise: 0 to 1 through a lifetime. field: closeness to the dent, 0 to 1. */
  life: Float32Array
  homeX: Float32Array
  homeY: Float32Array
  random: () => number
  dentX: number
  dentY: number
  heat: number
}

export interface PointerAt {
  x: number
  y: number
}

const AREA_PER_POINT: Record<Exclude<ParticleVariant, "field">, number> = { drift: 3000, constellation: 6000, rise: 3600 }
const FLOOR: Record<Exclude<ParticleVariant, "field">, number> = { drift: 16, constellation: 16, rise: 14 }
export const PARTICLE_CEILING: Record<ParticleVariant, number> = { drift: 120, constellation: 90, rise: 90, field: 1400 }

const FIELD_SPACING = 24

/** Even rows and columns that stay under the ceiling on a huge box, by opening the spacing rather than cutting the field. */
export function fieldGrid(width: number, height: number) {
  const fitted = Math.sqrt((width * height) / PARTICLE_CEILING.field)
  const spacing = Math.max(FIELD_SPACING, Math.ceil(fitted) + 1)
  const cols = Math.max(1, Math.floor(width / spacing))
  const rows = Math.max(1, Math.floor(height / spacing))
  return { spacing, cols, rows, offsetX: (width - (cols - 1) * spacing) / 2, offsetY: (height - (rows - 1) * spacing) / 2 }
}

export function particleCount(variant: ParticleVariant, width: number, height: number) {
  if (variant === "field") {
    const { cols, rows } = fieldGrid(width, height)
    return cols * rows
  }
  const wanted = Math.round((width * height) / AREA_PER_POINT[variant])
  return Math.min(PARTICLE_CEILING[variant], Math.max(FLOOR[variant], wanted))
}

function dentRadius(field: ParticleField) {
  return Math.min(field.width, field.height) * 0.6
}

/** Dots move out of the dent and fade inside it, so the sentence on top gets a clearing at rest. */
export function applyDent(field: ParticleField) {
  const radius = dentRadius(field)
  const maxPush = radius * 0.22
  for (let i = 0; i < field.count; i += 1) {
    const dx = (field.homeX[i] as number) - field.dentX
    const dy = (field.homeY[i] as number) - field.dentY
    const distance = Math.hypot(dx, dy) || 1
    const closeness = Math.max(0, 1 - distance / radius)
    const push = closeness * closeness * maxPush
    field.x[i] = (field.homeX[i] as number) + (dx / distance) * push
    field.y[i] = (field.homeY[i] as number) + (dy / distance) * push
    field.life[i] = closeness
  }
}

function seedField(field: ParticleField) {
  const { cols, spacing, offsetX, offsetY } = fieldGrid(field.width, field.height)
  for (let i = 0; i < field.count; i += 1) {
    field.homeX[i] = offsetX + (i % cols) * spacing
    field.homeY[i] = offsetY + Math.floor(i / cols) * spacing
    field.size[i] = 1.1
  }
  applyDent(field)
}

function seedPoint(field: ParticleField, i: number) {
  const { random, width, height, variant } = field
  const heading = random() * Math.PI * 2
  const speed = variant === "constellation" ? 6 + random() * 8 : 4 + random() * 6
  field.x[i] = random() * width
  field.y[i] = random() * height
  field.vx[i] = Math.cos(heading) * speed
  field.vy[i] = variant === "rise" ? 8 + random() * 16 : Math.sin(heading) * speed
  field.size[i] = 1 + random() * 1.2
  field.phase[i] = random() * Math.PI * 2
  field.life[i] = random()
}

export function seedParticles(variant: ParticleVariant, width: number, height: number, seed: number): ParticleField {
  const count = particleCount(variant, width, height)
  const slots = count + 1
  const field: ParticleField = {
    variant,
    width,
    height,
    count,
    x: new Float32Array(slots),
    y: new Float32Array(slots),
    vx: new Float32Array(slots),
    vy: new Float32Array(slots),
    size: new Float32Array(slots),
    phase: new Float32Array(slots),
    life: new Float32Array(slots),
    homeX: new Float32Array(variant === "field" ? slots : 0),
    homeY: new Float32Array(variant === "field" ? slots : 0),
    random: seededRandom(seed),
    dentX: width / 2,
    dentY: height / 2,
    heat: 0,
  }
  if (variant === "field") seedField(field)
  else for (let i = 0; i < count; i += 1) seedPoint(field, i)
  return field
}
