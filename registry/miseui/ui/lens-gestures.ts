import type * as React from "react"
import { useRef } from "react"
import { useReducedMotion } from "motion/react"
import { lensNudge, lensPointFromFraction, type Point, type Size } from "@/registry/miseui/ui/lens-math"
import { isFinePointer } from "@/registry/miseui/ui/pointer-fine"

const KEY_STEP_PX = 16
const KEY_STEP_LARGE_PX = 48
/** Past this a press is a drag: only then is the pointer captured, because capture retargets the click and a link inside would lose it. */
const DRAG_SLOP_PX = 4

function focusVisible(element: Element) {
  try {
    return element.matches(":focus-visible")
  } catch {
    return false
  }
}

interface PointerOptions {
  contentRef: React.RefObject<HTMLElement | null>
  press: boolean
  shown: boolean
  show: (point?: Point) => void
  hide: (dismiss?: boolean) => void
}

export function useLensPointer({ contentRef, press, shown, show, hide }: PointerOptions) {
  const reduceMotion = useReducedMotion() ?? false
  const pressStart = useRef<Point | null>(null)
  const pressedRef = useRef(false)
  const pointAt = (event: React.PointerEvent) => {
    const rect = contentRef.current?.getBoundingClientRect()
    return rect ? { x: event.clientX - rect.left, y: event.clientY - rect.top } : undefined
  }
  const follows = (event: React.PointerEvent) => event.pointerType !== "touch" && !reduceMotion && isFinePointer()
  const moved = (event: React.PointerEvent) => {
    const start = pressStart.current
    return !start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > DRAG_SLOP_PX
  }
  return {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      pressStart.current = { x: event.clientX, y: event.clientY }
      if (!press) return
      pressedRef.current = true
      show(pointAt(event))
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (pressedRef.current) {
        if (event.pointerType !== "touch" && moved(event) && !event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.setPointerCapture?.(event.pointerId)
        show(pointAt(event))
      } else if (!press && follows(event)) show(pointAt(event))
    },
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
      if (pressedRef.current) {
        pressedRef.current = false
        hide()
      } else if (!press && !follows(event) && !moved(event)) {
        // No hover to follow, so a tap places the lens and a second tap takes it away. The click still reaches what was tapped.
        if (shown) hide(true)
        else show(pointAt(event))
      }
    },
    onPointerCancel: () => {
      if (!pressedRef.current) return
      pressedRef.current = false
      hide()
    },
    onPointerLeave: (event: React.PointerEvent<HTMLElement>) => {
      if (!press && follows(event)) hide()
    },
  }
}

interface KeyOptions {
  box: Size | null
  pointRef: React.RefObject<Point | null>
  defaultPoint?: Point
  show: (point?: Point) => void
  hide: (dismiss?: boolean) => void
}

export function useLensKeys({ box, pointRef, defaultPoint, show, hide }: KeyOptions) {
  const current = (size: Size) => pointRef.current ?? lensPointFromFraction(defaultPoint, size)
  return {
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      // Only on the root itself: an arrow in a field inside the content belongs to that field.
      if (event.target !== event.currentTarget || !box) return
      if (event.key === "Escape") return hide(true)
      const next = lensNudge(current(box), event.key, box, event.shiftKey ? KEY_STEP_LARGE_PX : KEY_STEP_PX)
      if (!next) return
      event.preventDefault()
      show(next)
    },
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      if (event.target === event.currentTarget && box && focusVisible(event.target)) show(current(box))
    },
    onBlur: (event: React.FocusEvent<HTMLElement>) => {
      if (event.target === event.currentTarget) hide()
    },
  }
}
