export type PageSlot = number | "ellipsis-start" | "ellipsis-end"

interface PageWindowOptions {
  /** Current page, 1-based. Clamped to the valid range. */
  page: number
  /** Total number of pages. */
  pageCount: number
  /** Pages shown either side of the current one. */
  siblings?: number
  /** Pages always shown at each end. */
  boundaries?: number
}

const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index)

const clampCount = (value: number, fallback: number) => (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback)

/**
 * The page numbers to draw, with ellipses standing in for the rest. The slot count stays the same on every page,
 * so the Next button does not move out from under the pointer while someone clicks through. An ellipsis never
 * hides a single page: that page takes the slot instead.
 */
export function getPageWindow({ page, pageCount, siblings = 1, boundaries = 1 }: PageWindowOptions): PageSlot[] {
  const total = clampCount(pageCount, 0)
  if (total === 0) return []
  const edge = clampCount(boundaries, 1)
  const near = clampCount(siblings, 1)
  // Both edges, both sibling runs, the current page, and two ellipses.
  const slots = edge * 2 + near * 2 + 3
  if (total <= slots) return range(1, total)

  const current = Math.min(total, Math.max(1, Math.floor(page) || 1))
  const leftEdge = range(1, edge)
  const rightEdge = range(total - edge + 1, total)
  const showStart = current - near > edge + 2
  const showEnd = current + near < total - edge - 1
  // The run beside an edge fills every slot except that edge and its one ellipsis.
  const run = slots - edge - 1

  if (!showStart) return [...range(1, run), "ellipsis-end", ...rightEdge]
  if (!showEnd) return [...leftEdge, "ellipsis-start", ...range(total - run + 1, total)]
  return [...leftEdge, "ellipsis-start", ...range(current - near, current + near), "ellipsis-end", ...rightEdge]
}

/** A sliding run of dots, so a 40-slide carousel does not draw 40 dots. */
export function getDotWindow(page: number, pageCount: number, maxDots = 7): number[] {
  const total = clampCount(pageCount, 0)
  const shown = Math.min(total, Math.max(1, Math.floor(maxDots)))
  if (shown === 0) return []
  const current = Math.min(total, Math.max(1, Math.floor(page) || 1))
  const start = Math.min(total - shown + 1, Math.max(1, current - Math.floor(shown / 2)))
  return range(start, start + shown - 1)
}
