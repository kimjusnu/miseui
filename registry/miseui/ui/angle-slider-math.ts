const FULL_TURN = 360

interface DialRange {
  min: number
  max: number
  /** Degrees of the dial the range covers: 360 for a full circle, 270 for a gauge. */
  sweep: number
  /** Dial position of `min`, in degrees clockwise from the top. */
  start: number
}

function normalizeAngle(angle: number) {
  const turned = angle % FULL_TURN
  // The extra `+ 0` turns -0 into 0, which otherwise leaks into aria-valuenow.
  return (turned < 0 ? turned + FULL_TURN : turned) + 0
}

/** Degrees clockwise from the top, the way a dial is read. */
function pointerToAngle(x: number, y: number, centreX: number, centreY: number) {
  if (x === centreX && y === centreY) return 0
  return normalizeAngle((Math.atan2(x - centreX, centreY - y) * 180) / Math.PI)
}

/** Signed distance the short way round, in -180..180. */
function shortestDelta(from: number, to: number) {
  const delta = normalizeAngle(to - from)
  return delta > FULL_TURN / 2 ? delta - FULL_TURN : delta
}

/** Rounds on a grid anchored at `base`, then cuts binary noise so 0.1 + 0.2 reads as 0.3. */
function snapToStep(value: number, step: number, base = 0) {
  if (step <= 0) return value
  return Number((Math.round((value - base) / step) * step + base).toFixed(10))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function isFullCircle(range: DialRange) {
  return range.sweep >= FULL_TURN
}

function valueToAngle(value: number, range: DialRange) {
  const span = range.max - range.min
  if (span === 0) return normalizeAngle(range.start)
  return normalizeAngle(range.start + ((value - range.min) / span) * range.sweep)
}

function fractionOfRange(value: number, range: DialRange) {
  const span = range.max - range.min
  return span === 0 ? 0 : clamp((value - range.min) / span, 0, 1)
}

/** On a full circle the top is both ends of the range, so max folds onto min. */
function wrapValue(value: number, range: DialRange) {
  const span = range.max - range.min
  if (span <= 0) return range.min
  const turned = (value - range.min) % span
  return (turned < 0 ? turned + span : turned) + range.min + 0
}

/** Keyboard and step changes: wrap past the ends on a wrapping dial, otherwise stop at them. */
function stepValue(value: number, delta: number, range: DialRange, step: number, wrap: boolean) {
  const next = snapToStep(value + delta, step, range.min)
  return wrap && isFullCircle(range) ? wrapValue(next, range) : clamp(next, range.min, range.max)
}

/** Where on the range a pointer lands, or the nearer end when it is in the dead zone of a partial dial. */
function angleToValue(angle: number, range: DialRange) {
  const offset = normalizeAngle(angle - range.start)
  const span = range.max - range.min
  if (offset <= range.sweep) return range.min + (offset / range.sweep) * span
  const pastEnd = offset - range.sweep
  const beforeStart = FULL_TURN - offset
  return pastEnd <= beforeStart ? range.max : range.min
}

interface DragStep {
  angle: number
  previous: number
  range: DialRange
  step: number
  wrap: boolean
}

/**
 * The value for one pointer position during a drag. A bounded dial must not leap across its seam: moving
 * past the top from 350 lands on 0 for a wrapping dial, but stays at the end for one that does not wrap.
 */
function dragValue({ angle, previous, range, step, wrap }: DragStep) {
  const span = range.max - range.min
  const raw = angleToValue(angle, range)
  const snapped = clamp(snapToStep(raw, step, range.min), range.min, range.max)
  if (wrap && isFullCircle(range)) return wrapValue(snapped, range)
  const leaping = Math.abs(raw - previous) > span / 2
  if (!leaping) return snapped
  return previous - range.min > span / 2 ? range.max : range.min
}

/** Dial position in degrees. Not normalised: a gauge must animate along its arc, never across the gap. */
function dialRotation(value: number, range: DialRange) {
  return range.start + fractionOfRange(value, range) * range.sweep
}

function polarPoint(angle: number, radius: number, centre: number) {
  const radians = (angle * Math.PI) / 180
  return { x: centre + radius * Math.sin(radians), y: centre - radius * Math.cos(radians) }
}

/** SVG path along the dial, clockwise from `start`. */
function arcPath(start: number, sweep: number, radius: number, centre: number) {
  const from = polarPoint(start, radius, centre)
  const to = polarPoint(start + sweep, radius, centre)
  const large = sweep > 180 ? 1 : 0
  return `M${from.x.toFixed(3)} ${from.y.toFixed(3)}A${radius} ${radius} 0 ${large} 1 ${to.x.toFixed(3)} ${to.y.toFixed(3)}`
}

/** Value for a press. There is no drag to be continuous with, so a press may go anywhere on the range. */
function pressValue(angle: number, range: DialRange, step: number, wrap: boolean) {
  const snapped = clamp(snapToStep(angleToValue(angle, range), step, range.min), range.min, range.max)
  return wrap && isFullCircle(range) ? wrapValue(snapped, range) : snapped
}

export {
  angleToValue,
  arcPath,
  clamp,
  dialRotation,
  dragValue,
  fractionOfRange,
  isFullCircle,
  normalizeAngle,
  pointerToAngle,
  polarPoint,
  pressValue,
  shortestDelta,
  snapToStep,
  stepValue,
  valueToAngle,
  wrapValue,
  type DialRange,
}
