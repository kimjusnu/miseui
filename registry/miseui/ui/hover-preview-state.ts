import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { animate, useMotionValue, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"

const FINE_HOVER = "(hover: hover) and (pointer: fine)"
const POINTER_GAP_PX = 24
const VIEWPORT_MARGIN_PX = 16
const TILT_PER_PX = 0.6
const MAX_TILT_DEG = 8
const TILT_SETTLE_MS = 120
const FALLBACK_SIZE = { width: 288, height: 200 }
const KEYBOARD_ANCHOR_INSET_PX = 240

export interface Point {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

/** Beside the pointer, flipped near the right edge, never off the top or bottom. */
export function previewPosition(pointer: Point, size: Size, viewport: Size): Point {
  const right = pointer.x + POINTER_GAP_PX
  const fitsRight = right + size.width <= viewport.width - VIEWPORT_MARGIN_PX
  const x = fitsRight ? right : pointer.x - POINTER_GAP_PX - size.width
  const maxY = Math.max(VIEWPORT_MARGIN_PX, viewport.height - size.height - VIEWPORT_MARGIN_PX)
  const y = Math.min(maxY, Math.max(VIEWPORT_MARGIN_PX, pointer.y - size.height / 2))
  return { x: Math.max(VIEWPORT_MARGIN_PX, x), y }
}

/** The card leans into the direction of travel, which is what makes it feel carried along and not attached. */
export function tiltFor(deltaX: number) {
  return Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, deltaX * TILT_PER_PX))
}

/** A keyboard has no pointer, so the card sits as if the pointer were on the link's text. */
export function keyboardAnchor(rect: { left: number; top: number; width: number; height: number }): Point {
  return { x: rect.left + Math.min(rect.width, KEYBOARD_ANCHOR_INSET_PX), y: rect.top + rect.height / 2 }
}

function subscribeHover(onChange: () => void) {
  const query = window.matchMedia(FINE_HOVER)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/** False on touch: a finger has no hover, so nothing is set up there at all. */
export function useFineHover() {
  return useSyncExternalStore(subscribeHover, () => window.matchMedia(FINE_HOVER).matches, () => false)
}

export function usePreviewMotion(tilt: boolean) {
  const reduceMotion = useReducedMotion() ?? false
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useMotionValue(0)
  const [surface, setSurface] = useState<HTMLElement | null>(null)
  const last = useRef<Point | null>(null)
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined)

  const target = useCallback(
    (pointer: Point) =>
      previewPosition(pointer, surface ? { width: surface.offsetWidth, height: surface.offsetHeight } : FALLBACK_SIZE, {
        width: window.innerWidth,
        height: window.innerHeight,
      }),
    [surface],
  )

  /** Starts where the pointer is. Animating from the previous spot would fly it in from a corner of the screen. */
  const jumpTo = useCallback(
    (pointer: Point) => {
      const place = target(pointer)
      x.set(place.x)
      y.set(place.y)
      rotate.set(0)
      last.current = pointer
    },
    [rotate, target, x, y],
  )

  const follow = useCallback(
    (pointer: Point) => {
      const place = target(pointer)
      const before = last.current
      last.current = pointer
      if (reduceMotion) {
        x.set(place.x)
        y.set(place.y)
        return
      }
      animate(x, place.x, SPRING_DEFAULT)
      animate(y, place.y, SPRING_DEFAULT)
      if (!tilt || !before) return
      animate(rotate, tiltFor(pointer.x - before.x), SPRING_DEFAULT)
      clearTimeout(settle.current)
      settle.current = setTimeout(() => animate(rotate, 0, SPRING_DEFAULT), TILT_SETTLE_MS)
    },
    [reduceMotion, rotate, target, tilt, x, y],
  )

  useEffect(() => () => clearTimeout(settle.current), [])

  // The real size is only known once the portal has mounted, so the first placement is corrected here, before paint.
  useLayoutEffect(() => {
    if (!surface || !last.current) return
    const place = target(last.current)
    x.set(place.x)
    y.set(place.y)
  }, [surface, target, x, y])

  return useMemo(() => ({ x, y, rotate, setSurface, jumpTo, follow }), [x, y, rotate, jumpTo, follow])
}

export type PreviewMotion = ReturnType<typeof usePreviewMotion>

interface DismissOptions {
  visible: boolean
  onScroll: () => void
  onEscape: () => void
}

/** WCAG 1.4.13: content shown on hover has to be dismissible without moving the pointer. */
export function usePreviewDismiss({ visible, onScroll, onEscape }: DismissOptions) {
  useEffect(() => {
    if (!visible) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape()
    }
    window.addEventListener("keydown", onKey)
    // A page that scrolls under a still pointer has moved the link away from the card.
    window.addEventListener("scroll", onScroll, { passive: true, capture: true })
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("scroll", onScroll, { capture: true })
    }
  }, [visible, onScroll, onEscape])
}
