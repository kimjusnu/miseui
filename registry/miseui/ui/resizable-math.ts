import { projectMomentum, rubberband } from "@/registry/miseui/lib/motion"

const FULL = 100
/** Only the last moments of a drag say how fast the hand was going when it let go. */
const SAMPLE_WINDOW_MS = 100
/** Slower than this is a careful placement, not a flick, however close the edge is. */
const FLICK_MIN_SPEED_PX = 500

interface SizeLimits {
  min: number
  max: number
}

interface DragSample {
  position: number
  time: number
}

function clampSize(size: number, { min, max }: SizeLimits) {
  return Math.min(max, Math.max(min, size))
}

/** The size to paint during a drag: exact between the limits, then resisting more the further past them. */
function stretchSize(raw: number, limits: SizeLimits, lengthPx: number) {
  const clamped = clampSize(raw, limits)
  if (clamped === raw || lengthPx <= 0) return clamped
  const overshootPx = ((raw - clamped) / FULL) * lengthPx
  return clamped + (rubberband(overshootPx, lengthPx) / lengthPx) * FULL
}

function addSample(samples: readonly DragSample[], sample: DragSample) {
  return [...samples.filter((entry) => sample.time - entry.time <= SAMPLE_WINDOW_MS), sample]
}

/** Pixels per second at release. A hand that stopped and then let go has no velocity, whatever came before. */
function velocityOf(samples: readonly DragSample[], now: number) {
  const recent = samples.filter((entry) => now - entry.time <= SAMPLE_WINDOW_MS)
  if (recent.length < 2) return 0
  const first = recent[0]
  const last = recent[recent.length - 1]
  const elapsed = last.time - first.time
  return elapsed > 0 ? ((last.position - first.position) / elapsed) * 1000 : 0
}

/** Where a flick lands: fully collapsed one way or the other, or null when it would stop inside the limits. */
function flickTarget(size: number, velocityPx: number, lengthPx: number, limits: SizeLimits) {
  if (Math.abs(velocityPx) < FLICK_MIN_SPEED_PX || lengthPx <= 0) return null
  const projected = size + (projectMomentum(velocityPx) / lengthPx) * FULL
  if (projected < limits.min) return 0
  if (projected > limits.max) return FULL
  return null
}

/** A drag that starts collapsed may travel through the closed zone without jumping straight to the limit. */
function dragBounds(startSize: number, limits: SizeLimits): SizeLimits {
  return { min: Math.min(limits.min, startSize), max: Math.max(limits.max, startSize) }
}

/** Where a released drag settles. A collapsed pane pulled less than halfway to its limit stays collapsed. */
function restingSize(shown: number, startSize: number, limits: SizeLimits) {
  if (startSize < limits.min && shown < limits.min / 2) return startSize
  if (startSize > limits.max && shown > (limits.max + FULL) / 2) return startSize
  return clampSize(shown, limits)
}

interface KeyContext {
  key: string
  horizontal: boolean
  /** -1 when arrows run against the size, as in a right-to-left layout. */
  sign: number
  current: number
  step: number
  limits: SizeLimits
}

/** Size after an arrow, Home or End; null for any other key. */
function sizeForKey({ key, horizontal, sign, current, step, limits }: KeyContext) {
  const grow = horizontal ? "ArrowRight" : "ArrowDown"
  const shrink = horizontal ? "ArrowLeft" : "ArrowUp"
  if (key === grow) return clampSize(current + step * sign, limits)
  if (key === shrink) return clampSize(current - step * sign, limits)
  if (key === "Home") return limits.min
  if (key === "End") return limits.max
  return null
}

export {
  FULL,
  addSample,
  clampSize,
  dragBounds,
  flickTarget,
  restingSize,
  sizeForKey,
  stretchSize,
  velocityOf,
  type DragSample,
  type SizeLimits,
}
