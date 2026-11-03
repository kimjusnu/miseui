import { isDigit, type CountToken } from "@/registry/miseui/ui/count-up-math"

/** Digits 0 to 9 plus a second 0, so 9 rolls forward into 0 without a seam. */
const REEL_CELLS = 11
/** A low digit that would pass hundreds of steps turns once at most. Faster than that it is only a blur. */
const MAX_EXTRA_TURNS = 1

function wrapDigit(position: number) {
  return ((position % 10) + 10) % 10
}

/** Where a reel rests for a real value, in whole digit steps. */
function digitPosition(current: number, place: number, scale: number) {
  return wrapDigit(Math.floor(Math.abs(current) / scale / 10 ** place + 1e-9))
}

/** Digit each reel must end on for this value. Reels the number no longer reaches end on 0. */
function targetDigit(tokens: readonly CountToken[], place: number) {
  return tokens.filter(isDigit).find((token) => token.place === place)?.digit ?? 0
}

interface RollInput {
  /** Where the reel is now, perhaps halfway between two digits after an interruption. */
  start: number
  target: number
  from: number
  to: number
  place: number
  scale: number
}

/** Signed distance for one reel. High places travel what they really pass; low ones are capped so they stay readable. */
function rollDistance({ start, target, from, to, place, scale }: RollInput) {
  const direction = Math.abs(to) >= Math.abs(from) ? 1 : -1
  const unit = scale * 10 ** place
  const passed = Math.abs(Math.floor(Math.abs(to) / unit + 1e-9) - Math.floor(Math.abs(from) / unit + 1e-9))
  const turns = Math.min(MAX_EXTRA_TURNS, Math.floor(passed / 10))
  return direction * (wrapDigit((target - start) * direction) + turns * 10)
}

/** How far along the current run the count is. Reels read this, so one motion value drives every column. */
function reelProgress(from: number, to: number, current: number) {
  if (from === to) return 1
  return Math.min(1, Math.max(0, (current - from) / (to - from)))
}

/** The strip is REEL_CELLS tall, so a percentage of itself moves it by whole digits at any font size. */
function reelTransform(position: number) {
  return `translateY(${(-(wrapDigit(position) / REEL_CELLS) * 100).toFixed(4)}%)`
}

export { REEL_CELLS, digitPosition, reelProgress, reelTransform, rollDistance, targetDigit }
