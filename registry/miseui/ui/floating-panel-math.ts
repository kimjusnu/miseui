interface PanelPoint {
  x: number
  y: number
}

interface PanelSize {
  width: number
  height: number
}

type DockSide = "left" | "right"

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), Math.max(low, high))

/** Keeps the whole panel on screen. A panel larger than the bounds pins to the top left, where its title bar stays reachable. */
function clampPosition(position: PanelPoint, size: PanelSize, bounds: PanelSize): PanelPoint {
  return {
    x: clamp(position.x, 0, bounds.width - size.width),
    y: clamp(position.y, 0, bounds.height - size.height),
  }
}

/** Never smaller than `min`, and never past `max` or the room left between the panel's corner and the bounds. */
function clampSize(size: PanelSize, position: PanelPoint, bounds: PanelSize, min: PanelSize, max?: Partial<PanelSize>): PanelSize {
  return {
    width: clamp(size.width, min.width, Math.min(max?.width ?? Infinity, bounds.width - position.x)),
    height: clamp(size.height, min.height, Math.min(max?.height ?? Infinity, bounds.height - position.y)),
  }
}

/** The side the panel's centre is nearer to. */
function nearestSide(x: number, width: number, boundsWidth: number): DockSide {
  return x + width / 2 < boundsWidth / 2 ? "left" : "right"
}

function dockedX(side: DockSide, width: number, boundsWidth: number) {
  return side === "left" ? 0 : Math.max(boundsWidth - width, 0)
}

export { clamp, clampPosition, clampSize, dockedX, nearestSide, type DockSide, type PanelPoint, type PanelSize }
