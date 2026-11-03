interface TourRect {
  x: number
  y: number
  width: number
  height: number
}

interface TourSize {
  width: number
  height: number
}

type TourSide = "top" | "bottom" | "left" | "right"
type TourPlacement = TourSide | "auto"

interface PlaceOptions {
  /** The target, or null for a step about the whole page. */
  target: TourRect | null
  popover: TourSize
  viewport: TourSize
  placement?: TourPlacement
  gap?: number
  margin?: number
}

const AUTO_ORDER: readonly TourSide[] = ["bottom", "top", "right", "left"]
const DEFAULT_GAP = 12
const DEFAULT_MARGIN = 8

function clamp(value: number, min: number, max: number) {
  // A popover wider than the viewport pins to the leading edge, so its start stays readable.
  return max < min ? min : Math.min(max, Math.max(min, value))
}

function roomOn(side: TourSide, target: TourRect, viewport: TourSize) {
  const room: Record<TourSide, number> = {
    top: target.y,
    bottom: viewport.height - target.y - target.height,
    left: target.x,
    right: viewport.width - target.x - target.width,
  }
  return room[side]
}

function needed(side: TourSide, popover: TourSize, gap: number, margin: number) {
  const main = side === "top" || side === "bottom" ? popover.height : popover.width
  return main + gap + margin
}

/** The first side that fits, or the one that misses by least. A requested side is honoured only while it fits. */
function chooseSide(target: TourRect, { popover, viewport, placement = "auto", gap = DEFAULT_GAP, margin = DEFAULT_MARGIN }: PlaceOptions) {
  const order = placement === "auto" ? AUTO_ORDER : [placement, ...AUTO_ORDER.filter((side) => side !== placement)]
  const spare = (side: TourSide) => roomOn(side, target, viewport) - needed(side, popover, gap, margin)
  return order.find((side) => spare(side) >= 0) ?? order.reduce((best, side) => (spare(side) > spare(best) ? side : best))
}

/** Where the popover goes, in viewport pixels: beside the target, centred on it, and never off screen. */
function placePopover(options: PlaceOptions) {
  const { target, popover, viewport, gap = DEFAULT_GAP, margin = DEFAULT_MARGIN } = options
  const maxX = viewport.width - popover.width - margin
  const maxY = viewport.height - popover.height - margin
  if (!target) {
    return {
      x: clamp((viewport.width - popover.width) / 2, margin, maxX),
      y: clamp((viewport.height - popover.height) / 2, margin, maxY),
      side: null,
    }
  }
  const side = chooseSide(target, options)
  const centredX = target.x + (target.width - popover.width) / 2
  const centredY = target.y + (target.height - popover.height) / 2
  const raw: Record<TourSide, { x: number; y: number }> = {
    top: { x: centredX, y: target.y - popover.height - gap },
    bottom: { x: centredX, y: target.y + target.height + gap },
    left: { x: target.x - popover.width - gap, y: centredY },
    right: { x: target.x + target.width + gap, y: centredY },
  }
  return { x: clamp(raw[side].x, margin, maxX), y: clamp(raw[side].y, margin, maxY), side }
}

/** Grows the target by the padding, so the highlight has air around what it points at. */
function padRect(rect: TourRect, padding: number): TourRect {
  return { x: rect.x - padding, y: rect.y - padding, width: rect.width + padding * 2, height: rect.height + padding * 2 }
}

function isInViewport(rect: TourRect, viewport: TourSize) {
  return rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= viewport.width && rect.y + rect.height <= viewport.height
}

/** The next step in that direction that passes the test, starting at `from` itself, or -1 when there is none. */
function findStep<T>(steps: readonly T[], from: number, direction: 1 | -1, available: (step: T) => boolean) {
  for (let index = from; index >= 0 && index < steps.length; index += direction) {
    if (available(steps[index])) return index
  }
  return -1
}

export { findStep, isInViewport, padRect, placePopover, type TourPlacement, type TourRect, type TourSide, type TourSize }
