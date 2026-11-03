export const MAX_TILT_DEGREES = 12
export const PERSPECTIVE_PX = 1000
/** Padding on the still wrapper. It is what keeps a corner at full tilt inside the box, see `tiltReach`. */
export const TILT_RESERVE_PX = 8

const RADIANS = Math.PI / 180
const REST_EPSILON = 0.01

export function clampTilt(degrees: number) {
  if (!Number.isFinite(degrees)) return MAX_TILT_DEGREES
  return Math.min(Math.max(degrees, 0), MAX_TILT_DEGREES)
}

export interface Tilt {
  rotateX: number
  rotateY: number
}

/**
 * The edge under the pointer comes forward. Tilting it away would slide the card out from under a pointer near that
 * edge. Positions are read from a wrapper that never moves, so the share is stable as the card turns.
 */
export function tiltFromPointer(x: number, y: number, width: number, height: number, maxTilt: number): Tilt {
  if (width <= 0 || height <= 0) return { rotateX: 0, rotateY: 0 }
  const shareX = Math.min(Math.max(x / width - 0.5, -0.5), 0.5)
  const shareY = Math.min(Math.max(y / height - 0.5, -0.5), 0.5)
  return { rotateX: shareY * 2 * maxTilt, rotateY: -shareX * 2 * maxTilt }
}

/**
 * Returns "none" at rest instead of a zero rotation. Any 3D transform puts the card on its own layer, which leaves text
 * softer on a low-density screen, and text has to be sharp whenever nobody is touching the card.
 */
export function tiltTransform(rotateX: number, rotateY: number) {
  if (Math.abs(rotateX) < REST_EPSILON && Math.abs(rotateY) < REST_EPSILON) return "none"
  return `rotateX(${rotateX.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg)`
}

export function layerTransform(depth: number, lift: number) {
  const distance = depth * lift
  return Math.abs(distance) < REST_EPSILON ? "none" : `translateZ(${distance.toFixed(2)}px)`
}

/** Turning the card sweeps the band across it. Rests on none, so a card nobody touches holds no extra transform. */
export function glareTransform(rotateX: number, rotateY: number, maxTilt: number) {
  if (maxTilt <= 0 || (Math.abs(rotateX) < REST_EPSILON && Math.abs(rotateY) < REST_EPSILON)) return "none"
  return `translate(${((rotateY / maxTilt) * -28).toFixed(2)}%, ${((rotateX / maxTilt) * 18).toFixed(2)}%)`
}

/** How far outside its own box a point at (x, y, depth), measured from the card centre, lands on screen at the given tilt. */
export function projectCorner(x: number, y: number, depth: number, { rotateX, rotateY }: Tilt, perspective = PERSPECTIVE_PX) {
  const sinX = Math.sin(rotateX * RADIANS)
  const cosX = Math.cos(rotateX * RADIANS)
  const sinY = Math.sin(rotateY * RADIANS)
  const cosY = Math.cos(rotateY * RADIANS)
  const y1 = y * cosX - depth * sinX
  const z1 = y * sinX + depth * cosX
  const x2 = x * cosY + z1 * sinY
  const z2 = -x * sinY + z1 * cosY
  const scale = perspective / (perspective - z2)
  return { x: x2 * scale, y: y1 * scale }
}

/** The largest distance any corner of a width by height card passes its resting edge, over all full-tilt poses. */
export function tiltReach(width: number, height: number, maxTilt: number, perspective = PERSPECTIVE_PX) {
  const poses = [-maxTilt, maxTilt].flatMap((rotateX) => [-maxTilt, maxTilt].map((rotateY) => ({ rotateX, rotateY })))
  const corners = [-1, 1].flatMap((sx) => [-1, 1].map((sy) => [(sx * width) / 2, (sy * height) / 2] as const))
  return poses.reduce((reach, pose) => {
    return corners.reduce((widest, [x, y]) => {
      const { x: px, y: py } = projectCorner(x, y, 0, pose, perspective)
      return Math.max(widest, Math.abs(px) - width / 2, Math.abs(py) - height / 2)
    }, reach)
  }, 0)
}
