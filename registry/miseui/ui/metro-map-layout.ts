export type MetroLineTone = "mise" | "muted" | "ink"

export interface MetroStop {
  /** A stop with the same id on two lines is drawn once, as an interchange. */
  id: string
  label: string
  note?: string
  /** Order along the line. Only the order counts: stops are evenly spaced, so a busy stretch never overlaps. */
  at: number
  /** Which parallel track it sits on, from 0. */
  lane: number
  href?: string
  disabled?: boolean
}

export interface MetroLine {
  id: string
  label: string
  /** Lines differ by tone and, for `ink`, by dash too, so the map still reads without colour. */
  tone?: MetroLineTone
  stops: readonly MetroStop[]
}

const EDGE_FADE_PX = 24

/** Which ends of a scroller have more behind them. */
export function scrollEdges({ scrollLeft, clientWidth, scrollWidth }: { scrollLeft: number; clientWidth: number; scrollWidth: number }) {
  return { start: scrollLeft > 1, end: scrollLeft + clientWidth < scrollWidth - 1 }
}

/** A hard cut through a label reads as a bug. A fade reads as more to scroll, and stays off an edge with nothing behind it. */
export function edgeMask({ start, end }: { start: boolean; end: boolean }) {
  if (!start && !end) return undefined
  const from = start ? `transparent, black ${EDGE_FADE_PX}px` : "black 0"
  const to = end ? `black calc(100% - ${EDGE_FADE_PX}px), transparent` : "black 100%"
  return `linear-gradient(to right, ${from}, ${to})`
}

export interface MetroPoint {
  x: number
  y: number
}

export interface PlacedStation extends MetroStop, MetroPoint {
  lineLabels: readonly string[]
  tone: MetroLineTone
}

export interface PlacedLine {
  id: string
  label: string
  tone: MetroLineTone
  d: string
  points: readonly MetroPoint[]
}

export interface MetroLayout {
  orientation: "horizontal" | "vertical"
  gap: number
  laneGap: number
  padTime: number
  padLane: number
  bend: "diagonal" | "orthogonal"
  corner: number
}

export interface MetroPlan {
  width: number
  height: number
  lines: readonly PlacedLine[]
  stations: readonly PlacedStation[]
}

/** A polyline with its corners cut by a quadratic, the way a drawn metro line turns. */
export function roundedPath(points: readonly MetroPoint[], radius: number) {
  return points
    .map((point, step) => {
      const before = points[step - 1]
      const after = points[step + 1]
      if (!before) return `M${point.x} ${point.y}`
      if (!after || radius <= 0) return `L${point.x} ${point.y}`
      const inLength = Math.hypot(point.x - before.x, point.y - before.y) || 1
      const outLength = Math.hypot(after.x - point.x, after.y - point.y) || 1
      const cut = Math.min(radius, inLength / 2, outLength / 2)
      const startX = point.x - ((point.x - before.x) / inLength) * cut
      const startY = point.y - ((point.y - before.y) / inLength) * cut
      const endX = point.x + ((after.x - point.x) / outLength) * cut
      const endY = point.y + ((after.y - point.y) / outLength) * cut
      return `L${startX} ${startY}Q${point.x} ${point.y} ${endX} ${endY}`
    })
    .join("")
}

/** Share of the line's length up to a station: how far along it someone has come. */
export function progressAlong(points: readonly MetroPoint[], station: MetroPoint) {
  const lengths = points.slice(1).map((point, step) => {
    const before = points[step] as MetroPoint
    return Math.hypot(point.x - before.x, point.y - before.y)
  })
  const total = lengths.reduce((sum, length) => sum + length, 0)
  const index = points.findIndex((point) => point.x === station.x && point.y === station.y)
  if (total === 0 || index < 0) return 0
  return lengths.slice(0, index).reduce((sum, length) => sum + length, 0) / total
}

/** Time and lane are kept apart from x and y here, so one route serves both orientations. */
function routeStops(stops: readonly MetroStop[], time: (at: number) => number, lane: (index: number) => number, layout: MetroLayout) {
  return stops.flatMap((stop, step): Array<[number, number]> => {
    const place: [number, number] = [time(stop.at), lane(stop.lane)]
    const previous = stops[step - 1]
    if (!previous || previous.lane === stop.lane) return [place]
    const from = time(previous.at)
    const fromLane = lane(previous.lane)
    if (layout.bend === "orthogonal") {
      const middle = (from + place[0]) / 2
      return [[middle, fromLane], [middle, place[1]], place]
    }
    // A true 45 degrees when there is room; a tight hop takes what the gap allows.
    const run = Math.min(Math.abs(place[1] - fromLane), place[0] - from)
    return [[place[0] - run, fromLane], place]
  })
}

export function buildMetro(lines: readonly MetroLine[], layout: MetroLayout): MetroPlan {
  const allStops = lines.flatMap((line) => line.stops)
  const ranks = [...new Set(allStops.map((stop) => stop.at))].sort((a, b) => a - b)
  const maxLane = Math.max(0, ...allStops.map((stop) => stop.lane))
  const time = (at: number) => layout.padTime + ranks.indexOf(at) * layout.gap
  const lane = (index: number) => layout.padLane + index * layout.laneGap
  const toPoint = ([along, across]: [number, number]): MetroPoint =>
    layout.orientation === "horizontal" ? { x: along, y: across } : { x: across, y: along }

  const placedLines = lines.map((line): PlacedLine => {
    const stops = [...line.stops].sort((a, b) => a.at - b.at)
    const points = routeStops(stops, time, lane, layout).map(toPoint)
    return { id: line.id, label: line.label, tone: line.tone ?? "mise", d: roundedPath(points, layout.corner), points }
  })

  const stations = allStops.reduce<PlacedStation[]>((placed, stop) => {
    if (placed.some((station) => station.id === stop.id)) return placed
    const owners = lines.filter((line) => line.stops.some((other) => other.id === stop.id))
    const point = toPoint([time(stop.at), lane(stop.lane)])
    return [...placed, { ...stop, ...point, lineLabels: owners.map((line) => line.label), tone: owners[0]?.tone ?? "mise" }]
  }, [])

  const along = layout.padTime * 2 + Math.max(ranks.length - 1, 0) * layout.gap
  const across = layout.padLane * 2 + maxLane * layout.laneGap
  return {
    width: layout.orientation === "horizontal" ? along : across,
    height: layout.orientation === "horizontal" ? across : along,
    lines: placedLines,
    stations: [...stations].sort((a, b) => a.at - b.at || a.lane - b.lane),
  }
}

const DIRECTION: Record<string, MetroPoint> = {
  ArrowRight: { x: 1, y: 0 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowDown: { x: 0, y: 1 },
  ArrowUp: { x: 0, y: -1 },
}

const OFF_AXIS_PENALTY = 2

/** The station an arrow key points at: ahead on that axis, preferring the one nearest the line of travel. */
export function stationInDirection(stations: readonly PlacedStation[], fromId: string, key: string) {
  const from = stations.find((station) => station.id === fromId)
  const direction = DIRECTION[key]
  if (!from || !direction) return null
  const scored = stations.flatMap((station) => {
    if (station.id === fromId || station.disabled) return []
    const dx = station.x - from.x
    const dy = station.y - from.y
    const ahead = dx * direction.x + dy * direction.y
    if (ahead <= 0) return []
    const aside = Math.abs(dx * direction.y) + Math.abs(dy * direction.x)
    return [{ id: station.id, score: ahead + aside * OFF_AXIS_PENALTY }]
  })
  return [...scored].sort((a, b) => a.score - b.score)[0]?.id ?? null
}

/** Where to scroll so an element sits in the middle of its scroller. */
export function centeredScroll(left: number, width: number, viewWidth: number) {
  return Math.max(0, left + width / 2 - viewWidth / 2)
}
