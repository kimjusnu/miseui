import type { Transition } from "motion/react"

/**
 * Critically damped spring: no overshoot. The default for anything the user
 * did not throw. Apple ships damping 1.0 / response 0.35 s for the same job.
 */
export const SPRING_DEFAULT: Transition = { type: "spring", bounce: 0, duration: 0.35 }

/**
 * Slight overshoot, only after a gesture carried momentum (a flick, a drag
 * release). Overshoot on something that merely faded in reads as wrong.
 */
export const SPRING_MOMENTUM: Transition = { type: "spring", bounce: 0.2, duration: 0.4 }

/** Short settle for press feedback; must land under the ~100 ms perception threshold. */
export const SPRING_PRESS: Transition = { type: "spring", bounce: 0, duration: 0.15 }

const DEFAULT_DECELERATION_RATE = 0.998
const DEFAULT_RUBBERBAND_CONSTANT = 0.55

/**
 * Where a flick would come to rest if nothing stopped it (Apple's exponential
 * decay, not the textbook v²/2a). Pick the snap point nearest this value, then
 * hand the same velocity to the spring so there is no seam between drag and settle.
 */
export function projectMomentum(velocityPxPerSecond: number, decelerationRate = DEFAULT_DECELERATION_RATE) {
  return ((velocityPxPerSecond / 1000) * decelerationRate) / (1 - decelerationRate)
}

/**
 * Progressive resistance past a boundary. The further past the edge, the less
 * the element follows, so the edge reads as "nothing more here", not "frozen".
 */
export function rubberband(overshoot: number, dimension: number, constant = DEFAULT_RUBBERBAND_CONSTANT) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot))
}

/** Clamp a 0..1 progress value; NaN and out-of-range inputs are common from sensors. */
export function clampUnit(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}
