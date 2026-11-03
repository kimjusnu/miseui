interface ScrollMetrics {
  scrollTop: number
  scrollLeft: number
  scrollHeight: number
  scrollWidth: number
  clientHeight: number
  clientWidth: number
}

/** How far the content runs past each edge, in px. */
interface EdgeDistances {
  top: number
  bottom: number
  left: number
  right: number
}

type ScrollAxis = "y" | "x" | "both"

/** Zoomed pages report fractional scroll positions, so a list at its end can be 0.5 px short of it. */
const EDGE_TOLERANCE_PX = 1

const NO_EDGES: EdgeDistances = { top: 0, bottom: 0, left: 0, right: 0 }

function snap(distance: number) {
  return distance <= EDGE_TOLERANCE_PX ? 0 : Math.round(distance)
}

function edgeDistances(metrics: ScrollMetrics, axis: ScrollAxis, rtl = false): EdgeDistances {
  const vertical = axis !== "x"
  const horizontal = axis !== "y"
  const maxTop = metrics.scrollHeight - metrics.clientHeight
  const maxLeft = metrics.scrollWidth - metrics.clientWidth
  // Right to left, scrollLeft starts at 0 on the right edge and goes negative.
  const fromStart = Math.abs(metrics.scrollLeft)
  const fromEnd = maxLeft - fromStart
  return {
    top: vertical ? snap(metrics.scrollTop) : 0,
    bottom: vertical ? snap(maxTop - metrics.scrollTop) : 0,
    left: horizontal ? snap(rtl ? fromEnd : fromStart) : 0,
    right: horizontal ? snap(rtl ? fromStart : fromEnd) : 0,
  }
}

function sameEdges(a: EdgeDistances, b: EdgeDistances) {
  return a.top === b.top && a.bottom === b.bottom && a.left === b.left && a.right === b.right
}

function isOverflowing(edges: EdgeDistances) {
  return edges.top > 0 || edges.bottom > 0 || edges.left > 0 || edges.right > 0
}

/**
 * The fade grows with the distance from the edge, up to `size`. It follows the finger directly and needs no animation:
 * the last pixel of scroll takes the last pixel of fade.
 */
function fadeMask(edges: EdgeDistances, size: number) {
  const top = Math.min(edges.top, size)
  const bottom = Math.min(edges.bottom, size)
  const left = Math.min(edges.left, size)
  const right = Math.min(edges.right, size)
  const layers = []
  if (top > 0 || bottom > 0) layers.push(`linear-gradient(to bottom, transparent, black ${top}px, black calc(100% - ${bottom}px), transparent)`)
  if (left > 0 || right > 0) layers.push(`linear-gradient(to right, transparent, black ${left}px, black calc(100% - ${right}px), transparent)`)
  return layers.length > 0 ? layers.join(", ") : undefined
}

export { edgeDistances, fadeMask, isOverflowing, sameEdges, EDGE_TOLERANCE_PX, NO_EDGES, type EdgeDistances, type ScrollAxis, type ScrollMetrics }
