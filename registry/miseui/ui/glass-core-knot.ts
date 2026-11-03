export interface KnotPoint {
  x: number
  y: number
  z: number
}

export interface KnotBead {
  x: number
  y: number
  /** -1 far, 1 near. */
  depth: number
  scale: number
}

const WINDINGS = 2
const TWISTS = 3
/** Half the canvas minus the tube and the glow around it. */
export const FILL_SHARE = 0.34
const CAMERA_DISTANCE = 4
const REST_TILT = 0.5
const REST_TURN = 0.4
const LEAN_TURN = 0.6
const LEAN_TILT = 0.4
const DRIFT_TURN_PER_S = 0.15
const DRIFT_TILT_RATE = 0.4
const DRIFT_TILT = 0.2

/** A (2,3) torus knot scaled into a unit box. */
export function knotPoint(t: number): KnotPoint {
  const ring = Math.cos(TWISTS * t) + 2
  return { x: (ring * Math.cos(WINDINGS * t)) / 3, y: (ring * Math.sin(WINDINGS * t)) / 3, z: -Math.sin(TWISTS * t) / 3 }
}

export function buildKnot(segments: number) {
  return Array.from({ length: segments }, (_, step) => knotPoint((step / segments) * Math.PI * 2))
}

export function rotatePoint({ x, y, z }: KnotPoint, tilt: number, turn: number): KnotPoint {
  const turnedX = x * Math.cos(turn) + z * Math.sin(turn)
  const turnedZ = -x * Math.sin(turn) + z * Math.cos(turn)
  return {
    x: turnedX,
    y: y * Math.cos(tilt) - turnedZ * Math.sin(tilt),
    z: y * Math.sin(tilt) + turnedZ * Math.cos(tilt),
  }
}

/** Keeps the path order, because the raster reads each bead's neighbours for the direction of the tube. */
export function projectKnot(points: readonly KnotPoint[], tilt: number, turn: number, size: number): KnotBead[] {
  const center = size / 2
  const reach = size * FILL_SHARE * CAMERA_DISTANCE
  return points.map((point) => {
    const turned = rotatePoint(point, tilt, turn)
    const scale = 1 / (1 - turned.z / CAMERA_DISTANCE)
    return { x: center + (turned.x * reach * scale) / CAMERA_DISTANCE, y: center + (turned.y * reach * scale) / CAMERA_DISTANCE, depth: turned.z, scale }
  })
}

/** Pointer position against the element's centre, -1 to 1. A pointer far outside still only leans it fully. */
export function leanFrom(pointer: number, start: number, length: number) {
  if (length <= 0) return 0
  return Math.max(-1, Math.min(1, ((pointer - start) / length) * 2 - 1))
}

export function knotAngles(seconds: number, leanX: number, leanY: number) {
  return {
    tilt: REST_TILT + leanY * LEAN_TILT + Math.sin(seconds * DRIFT_TILT_RATE) * DRIFT_TILT,
    turn: REST_TURN + leanX * LEAN_TURN + seconds * DRIFT_TURN_PER_S,
  }
}
