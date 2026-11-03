export interface DockSlot {
  /** Middle of the resting slot, measured from the wrapper that does not move. */
  centre: number
  size: number
}

export interface DockShape {
  maxScale: number
  /** Distance at which an item stops reacting, in px. */
  reach: number
}

export interface DockLayout {
  scales: readonly number[]
  shifts: readonly number[]
  /** Everything the row has grown by, half on each side. */
  spread: number
}

/** 40 px becomes 56 px: enough to read as a lens, small enough to stay in a quiet interface. */
export const DOCK_SHAPE: DockShape = { maxScale: 1.4, reach: 96 }

/** A cosine bell: flat under the pointer and flat at the far end, so nothing visibly starts or stops. */
export function dockFalloff(distance: number, reach: number) {
  if (reach <= 0) return 0
  const progress = Math.abs(distance) / reach
  if (progress >= 1) return 0
  return (1 + Math.cos(Math.PI * progress)) / 2
}

/**
 * Scales alone would overlap neighbours, so each item also moves aside by what the items before it have gained.
 * `scales` and `shifts` come from one pair of values on purpose: per-item springs drift apart and overlap in transit.
 */
export function dockLayout(slots: readonly DockSlot[], pointer: number, presence: number, shape: DockShape = DOCK_SHAPE): DockLayout {
  const scales = slots.map((slot) => 1 + (shape.maxScale - 1) * presence * dockFalloff(pointer - slot.centre, shape.reach))
  const extras = slots.map((slot, index) => slot.size * ((scales[index] as number) - 1))
  const spread = extras.reduce((sum, extra) => sum + extra, 0)
  const shifts = extras.map((extra, index) => {
    const before = extras.slice(0, index).reduce((sum, value) => sum + value, 0)
    return before + extra / 2 - spread / 2
  })
  return { scales, shifts, spread }
}

/** The widest the row gets, for asking whether the page has room before the pointer has picked a spot. */
export function dockMaxSpread(slots: readonly DockSlot[], shape: DockShape = DOCK_SHAPE) {
  const middle = slots[Math.floor(slots.length / 2)]
  return middle ? dockLayout(slots, middle.centre, 1, shape).spread : 0
}

/** Growth past the window would widen the document, so a row without room stays at rest. */
export function dockHasRoom(left: number, right: number, viewportWidth: number, maxSpread: number) {
  return left >= maxSpread / 2 && viewportWidth - right >= maxSpread / 2
}
