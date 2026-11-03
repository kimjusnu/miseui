import { useLayoutEffect, useRef, useState, type RefObject } from "react"
import type { MotionValue } from "motion/react"
import type { CountFormat, CountToken } from "@/registry/miseui/ui/count-up-math"
import { REEL_CELLS, digitPosition, reelProgress, reelTransform, rollDistance, targetDigit } from "@/registry/miseui/ui/count-up-roll"
import { cn } from "@/registry/miseui/lib/utils"

type ReelLook = "odometer" | "board"

const STRIP_SELECTOR = "[data-slot='count-up-strip']"

const ROW_CLASS: Record<ReelLook, string> = {
  odometer: "items-baseline",
  board: "items-center gap-[0.1em]",
}

const REEL_CLASS: Record<ReelLook, string> = {
  odometer: "",
  board: "rounded-[0.18em] bg-muted ring-1 ring-inset ring-border",
}

/** The padding sits on every cell, not the tile, so a digit rolls right up to the tile edge instead of vanishing inside it. */
const CELL_CLASS: Record<ReelLook, string> = {
  odometer: "",
  board: "px-[0.22em] py-[0.08em]",
}

const MARK_CLASS: Record<ReelLook, string> = {
  odometer: "",
  board: "text-muted-foreground",
}

/** Every strip follows the one count, through one subscription per component rather than one motion value per column. */
function useReelWrites(rowRef: RefObject<HTMLElement | null>, count: MotionValue<number>, value: number, target: readonly CountToken[], scale: number, shapeKey: string) {
  const positions = useRef<ReadonlyMap<number, number>>(new Map())
  useLayoutEffect(() => {
    const strips = Array.from(rowRef.current?.querySelectorAll<HTMLElement>(STRIP_SELECTOR) ?? [])
    const from = count.get()
    const plan = strips.map((element) => {
      const place = Number(element.dataset.place)
      const start = positions.current.get(place) ?? digitPosition(from, place, scale)
      const distance = rollDistance({ start, target: targetDigit(target, place), from, to: value, place, scale })
      return { element, place, start, distance }
    })
    const write = (current: number) => {
      const progress = reelProgress(from, value, current)
      const placed = plan.map(({ element, place, start, distance }) => {
        const position = start + distance * progress
        element.style.transform = reelTransform(position)
        return [place, position] as const
      })
      positions.current = new Map(placed)
    }
    write(from)
    return count.on("change", write)
    // The tokens are rebuilt with the format; `value` and `shapeKey` are what actually change a plan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowRef, count, value, scale, shapeKey])
}

interface ReelProps {
  place: number
  glyphs: readonly string[]
  count: MotionValue<number>
  scale: number
  look: ReelLook
}

function Reel({ place, glyphs, count, scale, look }: ReelProps) {
  // Set once and never again: React must not repaint a transform the count is writing. A new reel starts on the shown digit.
  const [initial] = useState(() => reelTransform(digitPosition(count.get(), place, scale)))
  const cells = Array.from({ length: REEL_CELLS }, (_, cell) => glyphs[cell % 10])
  return (
    <span data-slot="count-up-reel" className={cn("relative inline-block overflow-clip", REEL_CLASS[look])}>
      {/* Holds the width, the height and the baseline; overflow-clip leaves the baseline where it is, unlike hidden. */}
      <span className={cn("invisible block text-center", CELL_CLASS[look])}>{glyphs[0]}</span>
      <span data-slot="count-up-strip" data-place={place} className="absolute inset-x-0 top-0 block will-change-transform" style={{ transform: initial }}>
        {cells.map((glyph, cell) => (
          <span key={cell} className={cn("block text-center", CELL_CLASS[look])}>
            {glyph}
          </span>
        ))}
      </span>
    </span>
  )
}

interface CountReelsProps {
  /** The digits and marks on screen, which may be wider than the target while a number shrinks. */
  shape: readonly CountToken[]
  target: readonly CountToken[]
  format: CountFormat
  value: number
  count: MotionValue<number>
  look: ReelLook
}

function CountReels({ shape, target, format, value, count, look }: CountReelsProps) {
  // Its own ref: a layout effect runs before a parent's ref is attached, so the root is still null on first mount.
  const rowRef = useRef<HTMLSpanElement>(null)
  const shapeKey = shape.map((token) => token.key).join("|")
  useReelWrites(rowRef, count, value, target, format.scale, shapeKey)
  return (
    <span ref={rowRef} aria-hidden="true" data-slot="count-up-visual" className={cn("pointer-events-none inline-flex select-none", ROW_CLASS[look])}>
      {shape.map((token) =>
        token.kind === "digit" ? (
          <Reel key={token.key} place={token.place} glyphs={format.glyphs} count={count} scale={format.scale} look={look} />
        ) : (
          <span key={token.key} data-slot="count-up-mark" className={cn("whitespace-pre", MARK_CLASS[look])}>
            {token.text}
          </span>
        ),
      )}
    </span>
  )
}

export { CountReels, type ReelLook }
