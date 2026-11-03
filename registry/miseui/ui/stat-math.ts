type StatPolarity = "neutral" | "up-is-good" | "down-is-good"
type StatDirection = "up" | "down" | "flat"
type StatTone = "good" | "bad" | "neutral"

function changeDirection(change: number): StatDirection {
  if (!Number.isFinite(change) || change === 0) return "flat"
  return change > 0 ? "up" : "down"
}

/** Colour only speaks when someone has said which way is good. Support tickets going up is not a win. */
function changeTone(direction: StatDirection, polarity: StatPolarity): StatTone {
  if (polarity === "neutral" || direction === "flat") return "neutral"
  const good = polarity === "up-is-good" ? "up" : "down"
  return direction === good ? "good" : "bad"
}

function formatChange(change: number, suffix: string, locale?: string) {
  const size = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(Math.abs(change))
  const direction = changeDirection(change)
  // A real minus sign, as wide as the plus, so a column of changes lines up.
  const sign = direction === "up" ? "+" : direction === "down" ? "−" : ""
  return `${sign}${size}${suffix}`
}

/** How many decimals the final number has, so a count-up to 3.4 never shows 3.41827 on the way. */
function decimalsOf(value: number) {
  if (!Number.isFinite(value) || Number.isInteger(value)) return 0
  const text = String(value)
  if (text.includes("e")) return 0
  return text.length - text.indexOf(".") - 1
}

function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Points for a line through the values. Flat data sits in the middle instead of on the floor, where it would read
 * as zero. Non-finite samples are dropped: one bad reading must not erase the whole line.
 */
function sparklinePoints(values: readonly number[], width: number, height: number, inset = 2) {
  const finite = values.filter((value) => Number.isFinite(value))
  if (finite.length === 0) return []
  const min = Math.min(...finite)
  const max = Math.max(...finite)
  const range = max - min
  const usable = height - inset * 2
  const step = finite.length > 1 ? width / (finite.length - 1) : 0
  return finite.map((value, index) => ({
    x: finite.length > 1 ? index * step : width / 2,
    y: range === 0 ? height / 2 : inset + usable - ((value - min) / range) * usable,
  }))
}

function sparklinePath(values: readonly number[], width: number, height: number) {
  const points = sparklinePoints(values, width, height)
  if (points.length === 0) return ""
  // One sample has no slope, so it is drawn as a level line across the box instead of an invisible dot.
  if (points.length === 1) return `M0 ${points[0].y} L${width} ${points[0].y}`
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ")
}

function sparklineArea(values: readonly number[], width: number, height: number) {
  const line = sparklinePath(values, width, height)
  return line ? `${line} L${width} ${height} L0 ${height} Z` : ""
}

export {
  changeDirection,
  changeTone,
  decimalsOf,
  formatChange,
  roundTo,
  sparklineArea,
  sparklinePath,
  sparklinePoints,
  type StatDirection,
  type StatPolarity,
  type StatTone,
}
