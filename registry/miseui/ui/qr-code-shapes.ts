import type { QrGrid } from "@/registry/miseui/ui/qr-code-matrix"

const FINDER_SIZE = 7
/** Share of the side a logo may clear. Above about a quarter of the side, level H starts to lose scans on small versions. */
const LOGO_SIDE_SHARE = 0.22
/** A dot slightly under one module keeps neighbours apart without starving the scanner of dark area. */
const DOT_RADIUS = 0.45
const FINDER_OUTER_RADIUS = 2
const FINDER_INNER_RADIUS = 1.25
const FINDER_CORE_RADIUS = 0.75

interface QrHole {
  start: number
  side: number
}

/** Always odd, so the hole stays centred on a module and the symbol stays symmetrical around it. */
function logoHole(size: number): QrHole {
  const side = Math.floor(size * LOGO_SIDE_SHARE) | 1
  return { start: (size - side) / 2, side }
}

function inHole(x: number, y: number, hole: QrHole | undefined) {
  if (!hole) return false
  return x >= hole.start && x < hole.start + hole.side && y >= hole.start && y < hole.start + hole.side
}

function isFinderModule(x: number, y: number, size: number) {
  const left = x < FINDER_SIZE
  const top = y < FINDER_SIZE
  const right = x >= size - FINDER_SIZE
  const bottom = y >= size - FINDER_SIZE
  return (left && top) || (right && top) || (left && bottom)
}

function run(y: number, from: number, to: number, offset: number) {
  return `M${from + offset} ${y + offset}h${to - from}v1h${from - to}z`
}

/** Joins horizontal runs into one path, so antialiasing cannot draw hairlines between neighbouring modules. */
function squarePath(modules: QrGrid, offset: number, hole?: QrHole) {
  return modules
    .map((row, y) => {
      const parts: string[] = []
      let start = -1
      for (let x = 0; x <= row.length; x += 1) {
        const dark = x < row.length && row[x] && !inHole(x, y, hole)
        if (dark && start === -1) start = x
        if (!dark && start !== -1) {
          parts.push(run(y, start, x, offset))
          start = -1
        }
      }
      return parts.join("")
    })
    .join("")
}

function circle(centreX: number, centreY: number, radius: number) {
  return `M${centreX - radius} ${centreY}a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0z`
}

function roundedRect(x: number, y: number, side: number, radius: number) {
  const straight = side - radius * 2
  const arc = (dx: number, dy: number) => `a${radius} ${radius} 0 0 1 ${dx} ${dy}`
  return [
    `M${x + radius} ${y}h${straight}`,
    arc(radius, radius),
    `v${straight}`,
    arc(-radius, radius),
    `h${-straight}`,
    arc(-radius, -radius),
    `v${-straight}`,
    arc(radius, -radius),
    "z",
  ].join("")
}

/** Scanners locate the symbol by these rings, so they stay solid while the data around them turns to dots. */
function finderPath(size: number, offset: number) {
  const corners = [
    [0, 0],
    [size - FINDER_SIZE, 0],
    [0, size - FINDER_SIZE],
  ]
  return corners
    .map(([x, y]) =>
      [
        roundedRect(x + offset, y + offset, FINDER_SIZE, FINDER_OUTER_RADIUS),
        roundedRect(x + offset + 1, y + offset + 1, FINDER_SIZE - 2, FINDER_INNER_RADIUS),
        roundedRect(x + offset + 2, y + offset + 2, FINDER_SIZE - 4, FINDER_CORE_RADIUS),
      ].join(""),
    )
    .join("")
}

function dotPath(modules: QrGrid, offset: number) {
  const size = modules.length
  return modules
    .flatMap((row, y) =>
      row.flatMap((dark, x) => (dark && !isFinderModule(x, y, size) ? [circle(x + offset + 0.5, y + offset + 0.5, DOT_RADIUS)] : [])),
    )
    .join("")
}

export { DOT_RADIUS, dotPath, finderPath, inHole, isFinderModule, logoHole, squarePath, type QrHole }
