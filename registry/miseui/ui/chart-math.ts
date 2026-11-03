interface ChartTicks {
  ticks: readonly number[]
  min: number
  max: number
  step: number
}

interface ChartPoint {
  x: number
  y: number
}

interface DonutSlice {
  index: number
  value: number
  share: number
  /** Radians clockwise from twelve o'clock. */
  start: number
  end: number
}

const FULL_TURN = Math.PI * 2
const round = (value: number) => Math.round(value * 100) / 100

/** Rounds up to 1, 2, 2.5, 5 or 10 times a power of ten, the steps people can add in their head. */
function niceStep(span: number, count: number) {
  const rough = span / Math.max(1, count)
  const power = 10 ** Math.floor(Math.log10(rough))
  const fraction = rough / power
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10
  return nice * power
}

/** A flat series still needs an axis with height, or every mark lands on one line at the edge. */
function widenFlat(low: number, high: number) {
  if (high > low) return [low, high]
  if (high === 0) return [0, 1]
  const pad = Math.abs(high) * 0.1
  return [low - pad, high + pad]
}

function niceTicks(values: readonly number[], count = 4, includeZero = true): ChartTicks {
  const finite = values.filter((value) => Number.isFinite(value))
  const seen = finite.length > 0 ? finite : [0]
  const low = includeZero ? Math.min(0, ...seen) : Math.min(...seen)
  const high = includeZero ? Math.max(0, ...seen) : Math.max(...seen)
  const [from, to] = widenFlat(low, high)
  const step = niceStep(to - from, count)
  const min = Math.floor(from / step) * step
  const max = Math.ceil(to / step) * step
  const steps = Math.round((max - min) / step)
  // Multiplying instead of adding keeps 0.1 + 0.2 out of the tick labels.
  const decimals = Math.max(0, 1 - Math.floor(Math.log10(step)))
  const ticks = Array.from({ length: steps + 1 }, (_, index) => Number((min + index * step).toFixed(decimals)))
  return { ticks, min: ticks[0], max: ticks[ticks.length - 1], step }
}

function scaleLinear(domain: readonly [number, number], range: readonly [number, number]) {
  const [d0, d1] = domain
  const [r0, r1] = range
  const ratio = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0)
  return (value: number) => r0 + (value - d0) * ratio
}

/** Line and area run edge to edge, so the first and last points sit on the plot's sides. */
function pointPositions(count: number, width: number) {
  if (count <= 1) return count === 1 ? [width / 2] : []
  return Array.from({ length: count }, (_, index) => (index * width) / (count - 1))
}

function bandPositions(count: number, width: number) {
  const band = count > 0 ? width / count : 0
  return Array.from({ length: count }, (_, index) => (index + 0.5) * band)
}

function nearestIndex(positions: readonly number[], x: number) {
  if (positions.length === 0) return null
  return positions.reduce((best, position, index) => (Math.abs(position - x) < Math.abs(positions[best] - x) ? index : best), 0)
}

const NARROW_CHAR_PX = 8
const WIDE_CHAR_PX = 13

/** Axis labels at 12 px. Compact numbers come back as 1.5K or 1.5천 depending on locale, and a wide character takes far more room. */
function axisLabelWidth(label: string) {
  return Array.from(label).reduce((total, char) => total + ((char.codePointAt(0) ?? 0) > 0x2e7f ? WIDE_CHAR_PX : NARROW_CHAR_PX), 0)
}

/** How many labels to skip so the longest one still fits. Always a whole stride, so the rhythm stays even. */
function labelStride(count: number, width: number, longestChars: number, charWidth = 7) {
  if (count <= 1 || width <= 0) return 1
  const needed = longestChars * charWidth + 12
  return Math.max(1, Math.ceil((needed * count) / width))
}

function splitSegments(points: readonly (ChartPoint | null)[]) {
  return points.reduce<ChartPoint[][]>((segments, point) => {
    if (point === null) return segments.at(-1)?.length === 0 ? segments : [...segments, []]
    const last = segments.at(-1) ?? []
    return [...segments.slice(0, -1), [...last, point]]
  }, [[]]).filter((segment) => segment.length > 0)
}

/** A missing value breaks the line. Joining across it would draw a figure nobody measured. */
function linePath(points: readonly (ChartPoint | null)[]) {
  return splitSegments(points)
    .map((segment) => {
      const [first, ...rest] = segment
      const start = `M${round(first.x)} ${round(first.y)}`
      // A lone point has no length to stroke; h0 with a round cap paints it as a dot.
      if (rest.length === 0) return `${start}h0`
      return `${start}${rest.map((point) => `L${round(point.x)} ${round(point.y)}`).join("")}`
    })
    .join("")
}

function areaPath(points: readonly (ChartPoint | null)[], baseline: number) {
  return splitSegments(points)
    .filter((segment) => segment.length > 1)
    .map((segment) => {
      const line = segment.map((point) => `L${round(point.x)} ${round(point.y)}`).join("")
      const first = segment[0]
      const last = segment[segment.length - 1]
      return `M${round(first.x)} ${round(baseline)}${line}L${round(last.x)} ${round(baseline)}Z`
    })
    .join("")
}

/** Rounds only the end away from the baseline, so a negative bar hangs from zero the same way. */
function barPath(left: number, top: number, width: number, baseline: number, radius: number) {
  const height = Math.abs(baseline - top)
  if (height === 0 || width <= 0) return ""
  const r = Math.min(radius, width / 2, height)
  const dir = top < baseline ? 1 : -1
  const right = left + width
  return [
    `M${round(left)} ${round(baseline)}`,
    `L${round(left)} ${round(top + dir * r)}`,
    `Q${round(left)} ${round(top)} ${round(left + r)} ${round(top)}`,
    `L${round(right - r)} ${round(top)}`,
    `Q${round(right)} ${round(top)} ${round(right)} ${round(top + dir * r)}`,
    `L${round(right)} ${round(baseline)}Z`,
  ].join("")
}

function polar(cx: number, cy: number, radius: number, angle: number) {
  return { x: cx + radius * Math.sin(angle), y: cy - radius * Math.cos(angle) }
}

/** An SVG arc whose ends meet draws nothing, so a whole circle goes in two halves. */
function arcPath(cx: number, cy: number, radius: number, start: number, end: number): string {
  const sweep = end - start
  if (sweep >= FULL_TURN - 0.0001) {
    const middle = start + sweep / 2
    return `${arcPath(cx, cy, radius, start, middle)}${arcPath(cx, cy, radius, middle, end).replace(/^M[^A]+/, "")}`
  }
  const from = polar(cx, cy, radius, start)
  const to = polar(cx, cy, radius, end)
  const large = sweep > Math.PI ? 1 : 0
  return `M${round(from.x)} ${round(from.y)}A${round(radius)} ${round(radius)} 0 ${large} 1 ${round(to.x)} ${round(to.y)}`
}

/** Zero and negative values have no share of a whole, so they get no slice. */
function donutSlices(values: readonly (number | null)[], gap = 0.03): readonly DonutSlice[] {
  const parts = values.map((value, index) => ({ index, value: value ?? 0 })).filter((part) => part.value > 0)
  const total = parts.reduce((sum, part) => sum + part.value, 0)
  if (total === 0) return []
  const inset = parts.length > 1 ? gap / 2 : 0
  return parts.reduce<DonutSlice[]>((slices, part) => {
    const from = slices.length > 0 ? slices[slices.length - 1].end + inset : 0
    const share = part.value / total
    const start = from + inset
    return [...slices, { index: part.index, value: part.value, share, start, end: from + share * FULL_TURN - inset }]
  }, [])
}

function angleAt(x: number, y: number, cx: number, cy: number) {
  const angle = Math.atan2(x - cx, cy - y)
  return angle < 0 ? angle + FULL_TURN : angle
}

/** The gaps between slices belong to the slice before them, so the pointer never falls into a hole. */
function sliceAtAngle(slices: readonly DonutSlice[], angle: number) {
  const hit = slices.find((slice) => angle <= slice.end)
  return (hit ?? slices[0])?.index ?? null
}

export {
  FULL_TURN,
  angleAt,
  arcPath,
  areaPath,
  axisLabelWidth,
  bandPositions,
  barPath,
  donutSlices,
  labelStride,
  linePath,
  nearestIndex,
  niceStep,
  niceTicks,
  pointPositions,
  polar,
  scaleLinear,
  sliceAtAngle,
  type ChartPoint,
  type ChartTicks,
  type DonutSlice,
}
