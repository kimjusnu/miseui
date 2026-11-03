export interface Size {
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

export type LensAnchor = "centre" | "above" | "band"

const clamp = (value: number, min: number, max: number) => (max < min ? (min + max) / 2 : Math.min(max, Math.max(min, value)))

/** What the view can be at most: a lens larger than its content would show the edge of nothing. */
export function lensViewSize(anchor: LensAnchor, size: number, box: Size): Size {
  return { width: anchor === "band" ? box.width : Math.min(size, box.width), height: Math.min(size, box.height) }
}

/**
 * The content point in the middle of the view. It stops short of the edges by half the sampled region,
 * which is what keeps empty space out of the view. Content smaller than the region stays centred.
 */
export function lensFocus(point: Point, box: Size, view: Size, zoom: number): Point {
  const halfWidth = view.width / (2 * zoom)
  const halfHeight = view.height / (2 * zoom)
  return { x: clamp(point.x, halfWidth, box.width - halfWidth), y: clamp(point.y, halfHeight, box.height - halfHeight) }
}

/** Where the zoomed copy goes, with its origin at the top left, so the focus lands in the middle of the view. */
export function lensCopyOffset(focus: Point, view: Size, zoom: number): Point {
  return { x: view.width / 2 - focus.x * zoom, y: view.height / 2 - focus.y * zoom }
}

/** Top left of the lens itself. `above` lifts it off the point it reads, and drops under the point when there is no room above. */
export function lensBodyPosition(point: Point, box: Size, view: Size, anchor: LensAnchor, gap = 16): Point {
  const maxX = box.width - view.width
  const maxY = box.height - view.height
  if (anchor === "band") return { x: 0, y: clamp(point.y - view.height / 2, 0, maxY) }
  const x = clamp(point.x - view.width / 2, 0, maxX)
  if (anchor === "centre") return { x, y: clamp(point.y - view.height / 2, 0, maxY) }
  const above = point.y - view.height - gap
  return { x, y: clamp(above >= 0 ? above : point.y + gap, 0, maxY) }
}

/** The region of the content a panel is showing, for the frame drawn over the original. */
export function lensRegion(focus: Point, view: Size, zoom: number) {
  const width = view.width / zoom
  const height = view.height / zoom
  return { x: focus.x - width / 2, y: focus.y - height / 2, width, height }
}

const KEY_STEP: Readonly<Record<string, Point>> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
}

/** The next point for an arrow key, inside the content, or null for any other key. */
export function lensNudge(point: Point, key: string, box: Size, step: number): Point | null {
  const direction = KEY_STEP[key]
  if (!direction) return null
  return { x: clamp(point.x + direction.x * step, 0, box.width), y: clamp(point.y + direction.y * step, 0, box.height) }
}

/** A point given as fractions of the content. */
export function lensPointFromFraction(fraction: Point | undefined, box: Size): Point {
  return { x: (fraction?.x ?? 0.5) * box.width, y: (fraction?.y ?? 0.5) * box.height }
}
