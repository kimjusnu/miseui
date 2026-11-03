/** One drawn line of text, in pixels from the mark's anchor. */
interface LineRect {
  left: number
  top: number
  width: number
  height: number
}

interface BoxLike {
  left: number
  top: number
  right: number
  bottom: number
}

interface LineTiming {
  /** Seconds after the mark starts. */
  delay: number
  /** Seconds for this line. */
  duration: number
}

const MIN_LINE_SECONDS = 0.28
const MAX_LINE_SECONDS = 0.6
/** A hand crosses roughly this many pixels in a second, so short lines do not take as long as long ones. */
const DRAW_PIXELS_PER_SECOND = 620
/** The next line starts as the last one is nearly done: a spring has done most of its travel by then. */
const LINE_HANDOVER = 0.72

const round = (value: number) => Math.round(value * 10) / 10

/**
 * A Range reports one box per inline fragment, so a phrase with a <strong> inside gives several boxes on one line and
 * the same line twice when text and element both report. Whatever overlaps vertically by half is one line.
 */
function mergeLineRects(boxes: readonly BoxLike[], origin: { left: number; top: number }): readonly LineRect[] {
  const visible = boxes.filter((box) => box.right > box.left && box.bottom > box.top)
  const lines = visible.reduce<readonly BoxLike[]>((merged, box) => {
    const last = merged[merged.length - 1]
    if (!last) return [box]
    const overlap = Math.min(last.bottom, box.bottom) - Math.max(last.top, box.top)
    const sameLine = overlap > Math.min(last.bottom - last.top, box.bottom - box.top) / 2
    if (!sameLine) return [...merged, box]
    const joined = {
      left: Math.min(last.left, box.left),
      top: Math.min(last.top, box.top),
      right: Math.max(last.right, box.right),
      bottom: Math.max(last.bottom, box.bottom),
    }
    return [...merged.slice(0, -1), joined]
  }, [])
  return lines.map((line) => ({
    left: round(line.left - origin.left),
    top: round(line.top - origin.top),
    width: round(line.right - line.left),
    height: round(line.bottom - line.top),
  }))
}

function sameLines(a: readonly LineRect[], b: readonly LineRect[]) {
  return a.length === b.length && a.every((line, index) => line.left === b[index].left && line.top === b[index].top && line.width === b[index].width && line.height === b[index].height)
}

/** Reading order, one line handing over to the next, each taking time for its own width. */
function lineSchedule(lines: readonly LineRect[]): readonly LineTiming[] {
  return lines.reduce<{ timings: readonly LineTiming[]; next: number }>(
    ({ timings, next }, line) => {
      const duration = Math.min(MAX_LINE_SECONDS, Math.max(MIN_LINE_SECONDS, line.width / DRAW_PIXELS_PER_SECOND))
      return { timings: [...timings, { delay: next, duration }], next: next + duration * LINE_HANDOVER }
    },
    { timings: [], next: 0 },
  ).timings
}

/** Seconds until a group may start the next mark. */
function scheduleSeconds(timings: readonly LineTiming[]) {
  const last = timings[timings.length - 1]
  return last ? last.delay + last.duration * LINE_HANDOVER : 0
}

/** The same text always gets the same stroke, so a server render, a re-measure and a replay all agree. */
function seedFromText(text: string) {
  return Array.from(text).reduce((hash, character) => Math.imul(hash ^ (character.codePointAt(0) ?? 0), 16777619) >>> 0, 2166136261)
}

/** A pure step of mulberry32, returning a value in 0..1 for this seed and position. */
function seededUnit(seed: number, position: number) {
  const mixed = (seed + Math.imul(position + 1, 0x6d2b79f5)) >>> 0
  const first = Math.imul(mixed ^ (mixed >>> 15), mixed | 1)
  const second = (first + Math.imul(first ^ (first >>> 7), first | 61)) ^ first
  return ((second ^ (second >>> 14)) >>> 0) / 4294967296
}

/** Signed wobble within -reach..reach. */
const wobble = (seed: number, position: number, reach: number) => round((seededUnit(seed, position) * 2 - 1) * reach)

const SEGMENT_PIXELS = 110
const STROKE_WOBBLE = 1.4

/** A single confident stroke along y = 0: a little past each end, never quite straight, with one small lean over its length. */
function sketchStrokePath(width: number, seed: number) {
  const segments = Math.max(1, Math.min(6, Math.round(width / SEGMENT_PIXELS)))
  const startX = wobble(seed, 0, 2)
  const endX = round(width + wobble(seed, 1, 2))
  const lean = wobble(seed, 2, 1.5)
  const span = (endX - startX) / segments
  const steps = Array.from({ length: segments }, (_, step) => {
    const x = startX + span * (step + 1)
    const y = step === segments - 1 ? lean : wobble(seed, 3 + step * 2, STROKE_WOBBLE)
    const controlX = round(x - span / 2)
    const controlY = wobble(seed, 4 + step * 2, STROKE_WOBBLE * 1.6)
    return `Q${controlX} ${controlY} ${round(x)} ${y}`
  })
  return `M${startX} ${wobble(seed, 3, 1)} ${steps.join(" ")}`
}

const CORNER = 6
const BOX_WOBBLE = 1.2
/** Past the starting corner, the way a pen closes a circle by running over its own start. */
const BOX_OVERRUN = 14

/** A loop drawn clockwise around a box from 0,0 to width,height, with soft corners and an end that overruns its start. */
function sketchBoxPath(width: number, height: number, seed: number) {
  const corner = Math.min(CORNER, height / 2, width / 2)
  const shift = (position: number) => wobble(seed, position, BOX_WOBBLE)
  const right = round(width + shift(0))
  const bottom = round(height + shift(1))
  const overrun = Math.min(BOX_OVERRUN, width / 3)
  return [
    `M${round(corner + shift(2))} ${shift(3)}`,
    `Q${round(width / 2)} ${shift(4)} ${round(right - corner)} ${shift(5)}`,
    `Q${right} 0 ${right} ${round(corner)}`,
    `L${round(right + shift(6))} ${round(bottom - corner)}`,
    `Q${right} ${bottom} ${round(right - corner)} ${bottom}`,
    `Q${round(width / 2)} ${round(bottom + shift(7))} ${round(corner)} ${round(bottom + shift(8))}`,
    `Q0 ${bottom} ${shift(9)} ${round(bottom - corner)}`,
    `L${shift(10)} ${round(corner)}`,
    `Q0 ${shift(11)} ${round(corner)} ${shift(12)}`,
    `L${round(corner + overrun)} ${shift(13)}`,
  ].join(" ")
}

export {
  lineSchedule,
  mergeLineRects,
  sameLines,
  scheduleSeconds,
  seededUnit,
  seedFromText,
  sketchBoxPath,
  sketchStrokePath,
  type BoxLike,
  type LineRect,
  type LineTiming,
}
