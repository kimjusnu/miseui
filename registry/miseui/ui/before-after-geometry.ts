export type BeforeAfterVariant = "split" | "curtain" | "lens"

export const MIN_SHARE = 0
export const MAX_SHARE = 100
const PAGE_STEP_MULTIPLE = 2
const LENS_RADIUS = "min(72px, 28cqw)"

export function clampShare(share: number) {
  if (Number.isNaN(share)) return MIN_SHARE
  return Math.min(MAX_SHARE, Math.max(MIN_SHARE, share))
}

export function shareAlong(pointer: number, start: number, length: number, fallback: number) {
  if (length <= 0) return fallback
  return clampShare(((pointer - start) / length) * 100)
}

/** Keys move the divider the way it looks: Up on the horizontal divider moves it up, which lowers the share of the top image. */
export function shareForKey(key: string, share: number, step: number) {
  const moves: Record<string, number> = {
    ArrowLeft: share - step,
    ArrowUp: share - step,
    ArrowRight: share + step,
    ArrowDown: share + step,
    PageUp: share + step * PAGE_STEP_MULTIPLE,
    PageDown: share - step * PAGE_STEP_MULTIPLE,
    Home: MIN_SHARE,
    End: MAX_SHARE,
  }
  const next = moves[key]
  return next === undefined ? null : clampShare(next)
}

export function clipFor(variant: BeforeAfterVariant, share: number, cross: number) {
  if (variant === "curtain") return `inset(0 0 ${MAX_SHARE - share}% 0)`
  if (variant === "lens") return `circle(${LENS_RADIUS} at ${share}% ${cross}%)`
  return `inset(0 ${MAX_SHARE - share}% 0 0)`
}

/** A demonstration, not a value change: it goes out and comes back to where it started. */
export function sweepFrames(share: number, reach: number) {
  return [share, clampShare(share - reach), clampShare(share + reach), share]
}
