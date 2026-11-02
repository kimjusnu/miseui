const VIEW_SIZE = 100

/** Null means nobody knows how far along the work is, so `NaN` from a bad division lands there too. */
function toPercent(value: number | null | undefined, max: number) {
  if (value === null || value === undefined || Number.isNaN(value) || max <= 0) return null
  return (Math.min(max, Math.max(0, value)) / max) * 100
}

function circumferenceOf(strokeWidth: number) {
  return 2 * Math.PI * ((VIEW_SIZE - strokeWidth) / 2)
}

/** The dash starts at the path start, because an offset dash loses its round cap at that end. */
function arcDash(fraction: number, circumference: number) {
  return `${fraction * circumference} ${circumference * 2}`
}

/** Any work shows, and only finished work fills every cell, so a rounded 99% never looks done. */
function litCells(percent: number, steps: number) {
  if (percent <= 0) return 0
  if (percent >= 100) return steps
  return Math.min(steps - 1, Math.max(1, Math.round((percent / 100) * steps)))
}

export { arcDash, circumferenceOf, litCells, toPercent, VIEW_SIZE }
