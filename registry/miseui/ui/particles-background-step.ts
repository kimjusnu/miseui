import { applyDent, particleCount, seedParticles, type ParticleField, type PointerAt } from "@/registry/miseui/ui/particles-background-engine"

const WRAP_MARGIN = 8
const BOUNCE_MARGIN = 12
const PUSH_RADIUS = 96
const PUSH_SPEED = 36
const DENT_RATE = 8

function wrap(value: number, size: number, margin: number) {
  if (value < -margin) return size + margin
  if (value > size + margin) return -margin
  return value
}

function pushAway(field: ParticleField, i: number, pointer: PointerAt, dt: number) {
  const dx = (field.x[i] as number) - pointer.x
  const dy = (field.y[i] as number) - pointer.y
  const distance = Math.hypot(dx, dy)
  if (distance >= PUSH_RADIUS || distance === 0) return
  const force = (1 - distance / PUSH_RADIUS) * PUSH_SPEED * dt
  field.x[i] = (field.x[i] as number) + (dx / distance) * force
  field.y[i] = (field.y[i] as number) + (dy / distance) * force
}

function stepDrift(field: ParticleField, dt: number, pointer: PointerAt | null) {
  for (let i = 0; i < field.count; i += 1) {
    const phase = (field.phase[i] as number) + dt * 0.4
    field.phase[i] = phase
    field.x[i] = wrap((field.x[i] as number) + ((field.vx[i] as number) + Math.sin(phase) * 3) * dt, field.width, WRAP_MARGIN)
    field.y[i] = wrap((field.y[i] as number) + ((field.vy[i] as number) + Math.cos(phase) * 3) * dt, field.height, WRAP_MARGIN)
    if (pointer) pushAway(field, i, pointer, dt)
  }
}

/** Bounces rather than wraps: a point jumping to the far side would snap its links away in one frame. */
function bounce(position: Float32Array, velocity: Float32Array, i: number, size: number) {
  const value = position[i] as number
  if (value < -BOUNCE_MARGIN) velocity[i] = Math.abs(velocity[i] as number)
  else if (value > size + BOUNCE_MARGIN) velocity[i] = -Math.abs(velocity[i] as number)
}

function stepConstellation(field: ParticleField, dt: number) {
  for (let i = 0; i < field.count; i += 1) {
    field.x[i] = (field.x[i] as number) + (field.vx[i] as number) * dt
    field.y[i] = (field.y[i] as number) + (field.vy[i] as number) * dt
    bounce(field.x, field.vx, i, field.width)
    bounce(field.y, field.vy, i, field.height)
  }
}

function stepRise(field: ParticleField, dt: number) {
  for (let i = 0; i < field.count; i += 1) {
    const phase = (field.phase[i] as number) + dt * 0.8
    const life = (field.life[i] as number) + dt / 9
    field.phase[i] = phase
    field.x[i] = (field.x[i] as number) + Math.sin(phase) * 6 * dt
    field.y[i] = (field.y[i] as number) - (field.vy[i] as number) * dt
    field.life[i] = life
    if (life >= 1) {
      field.life[i] = 0
      field.x[i] = field.random() * field.width
      field.y[i] = field.height * (0.55 + field.random() * 0.5)
    }
  }
}

/** Returns false once settled, so a resting field stops asking for frames and costs nothing. */
function stepDent(field: ParticleField, dt: number, pointer: PointerAt | null) {
  const ease = 1 - Math.exp(-dt * DENT_RATE)
  const moveX = ((pointer?.x ?? field.width / 2) - field.dentX) * ease
  const moveY = ((pointer?.y ?? field.height / 2) - field.dentY) * ease
  const warm = ((pointer ? 1 : 0) - field.heat) * ease
  if (Math.abs(moveX) < 0.02 && Math.abs(moveY) < 0.02 && Math.abs(warm) < 0.002) return false
  field.dentX += moveX
  field.dentY += moveY
  field.heat += warm
  applyDent(field)
  return true
}

/** Advances one frame. Returns whether anything moved. */
export function stepParticles(field: ParticleField, dt: number, pointer: PointerAt | null) {
  if (pointer) {
    field.x[field.count] = pointer.x
    field.y[field.count] = pointer.y
  }
  if (field.variant === "field") return stepDent(field, dt, pointer)
  if (field.variant === "drift") stepDrift(field, dt, pointer)
  else if (field.variant === "rise") stepRise(field, dt)
  else stepConstellation(field, dt)
  return true
}

/** Carries the current state over to a new box, keeping points in place by proportion, unless the count must change. */
export function resizeParticles(field: ParticleField, width: number, height: number, seed: number): ParticleField {
  if (field.variant === "field" || particleCount(field.variant, width, height) !== field.count) return seedParticles(field.variant, width, height, seed)
  const scaleX = width / field.width
  const scaleY = height / field.height
  return { ...field, width, height, x: field.x.map((value) => value * scaleX), y: field.y.map((value) => value * scaleY) }
}
