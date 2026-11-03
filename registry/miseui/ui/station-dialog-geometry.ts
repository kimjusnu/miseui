export interface OriginBox {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

interface Size {
  width: number
  height: number
}

const PIN_GAP_PX = 12
const VIEWPORT_MARGIN_PX = 16

function clamp(value: number, low: number, high: number) {
  return Math.max(low, Math.min(Math.max(low, high), value))
}

/** How far a centred surface has to travel to start on top of the point it opened from. */
export function morphOffset(origin: OriginBox, viewport: Size) {
  return {
    x: origin.left + origin.width / 2 - viewport.width / 2,
    y: origin.top + origin.height / 2 - viewport.height / 2,
  }
}

/** Beside the point if there is room on either side, otherwise under or over it, and always inside the screen. */
export function pinPosition(origin: OriginBox, size: Size, viewport: Size) {
  const centerX = origin.left + origin.width / 2
  const centerY = origin.top + origin.height / 2
  const maxLeft = viewport.width - size.width - VIEWPORT_MARGIN_PX
  const maxTop = viewport.height - size.height - VIEWPORT_MARGIN_PX
  const besideTop = clamp(centerY - size.height / 2, VIEWPORT_MARGIN_PX, maxTop)

  const rightOf = origin.right + PIN_GAP_PX
  if (rightOf <= maxLeft) return { left: rightOf, top: besideTop, originX: 0, originY: centerY - besideTop }
  const leftOf = origin.left - PIN_GAP_PX - size.width
  if (leftOf >= VIEWPORT_MARGIN_PX) return { left: leftOf, top: besideTop, originX: size.width, originY: centerY - besideTop }

  const left = clamp(centerX - size.width / 2, VIEWPORT_MARGIN_PX, maxLeft)
  const under = origin.bottom + PIN_GAP_PX
  if (under <= maxTop) return { left, top: under, originX: centerX - left, originY: 0 }
  const top = clamp(origin.top - PIN_GAP_PX - size.height, VIEWPORT_MARGIN_PX, maxTop)
  return { left, top, originX: centerX - left, originY: size.height }
}
