import type * as React from "react"
import { useRef, useState } from "react"
import { animate, motion, useMotionTemplate, useMotionValue, useMotionValueEvent, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"

const START_SHARE = 50
const MIN_SHARE = 0
const MAX_SHARE = 100
const KEY_STEP = 5

/**
 * Two versions of the same screen, stacked, with the top one clipped at the handle. Dragging follows the
 * pointer 1:1 from wherever it was grabbed, and a press anywhere springs the handle there from its current position.
 */
export function BeforeAfter({ before, after }: { before: React.ReactNode; after: React.ReactNode }) {
  const reduceMotion = useReducedMotion()
  const frameRef = useRef<HTMLDivElement>(null)
  const share = useMotionValue(START_SHARE)
  const [dragging, setDragging] = useState(false)
  const clip = useMotionTemplate`inset(0 0 0 ${share}%)`
  const handleLeft = useMotionTemplate`${share}%`

  // Written to the DOM directly so a drag does not re-render both screens on every frame.
  useMotionValueEvent(share, "change", (value) => {
    frameRef.current?.setAttribute("aria-valuenow", String(Math.round(value)))
  })

  const shareAt = (clientX: number) => {
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return share.get()
    return Math.min(MAX_SHARE, Math.max(MIN_SHARE, ((clientX - rect.left) / rect.width) * 100))
  }

  const moveTo = (next: number) => {
    if (reduceMotion) share.set(next)
    else animate(share, next, SPRING_DEFAULT)
  }

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
    moveTo(shareAt(event.clientX))
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragging) share.set(shareAt(event.clientX))
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
    event.preventDefault()
    const delta = event.key === "ArrowLeft" ? -KEY_STEP : KEY_STEP
    moveTo(Math.min(MAX_SHARE, Math.max(MIN_SHARE, share.get() + delta)))
  }

  return (
    <div
      ref={frameRef}
      role="slider"
      tabIndex={0}
      aria-label="Compare the plain version with the Mise UI version"
      aria-valuemin={MIN_SHARE}
      aria-valuemax={MAX_SHARE}
      aria-valuenow={START_SHARE}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onKeyDown={onKeyDown}
      className="relative aspect-[5/4] w-full cursor-ew-resize touch-pan-y overflow-hidden rounded-[28px] border bg-background shadow-[0_24px_60px_-28px_color-mix(in_oklab,var(--foreground)_35%,transparent)] outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <div className="absolute inset-0">{before}</div>
      <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
        {after}
      </motion.div>
      <motion.div className="pointer-events-none absolute inset-y-0 w-px bg-foreground/25" style={{ left: handleLeft }}>
        <span className="absolute top-1/2 left-1/2 grid h-10 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border bg-background shadow-md">
          <span className="flex gap-0.5">
            <span className="h-3.5 w-px bg-muted-foreground" />
            <span className="h-3.5 w-px bg-muted-foreground" />
          </span>
        </span>
      </motion.div>
    </div>
  )
}
