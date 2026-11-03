import type * as React from "react"
import { createContext, useCallback, useEffect, useRef, useState } from "react"
import { useMotionValue, useSpring, type MotionValue } from "motion/react"
import { distanceToBox, magnetFalloff, magnetPull, nextLatched, type Point } from "@/registry/miseui/ui/magnet-math"
import { isFinePointer } from "@/registry/miseui/ui/pointer-fine"

/** Critical damping with the 0.35 s response of SPRING_DEFAULT. useSpring takes physics, not a duration. */
const FOLLOW_SPRING = { stiffness: 322, damping: 36, mass: 1 }
const LATCHED_STRENGTH = 0.6

export interface PointerListener {
  move: (point: Point) => void
  end: () => void
}

export interface MagnetGroupValue {
  reach: number
  add: (listener: PointerListener) => () => void
}

export const MagnetGroupContext = createContext<MagnetGroupValue | null>(null)
export const MagnetBodyContext = createContext<{ x: MotionValue<number>; y: MotionValue<number> } | null>(null)

/**
 * The reach goes past the element's bounds, so the listener is on the document and passive: it can never take a click
 * or a scroll from a neighbour. It exists only while the element is on screen and the input has a fine pointer.
 */
export function useDocumentPointer(rootRef: React.RefObject<HTMLElement | null>, listener: PointerListener, enabled: boolean) {
  const { move, end } = listener
  useEffect(() => {
    const root = rootRef.current
    if (!enabled || !root) return
    const state = { onScreen: typeof IntersectionObserver === "undefined", attached: false }
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "touch") move({ x: event.clientX, y: event.clientY })
    }
    const sync = () => {
      const wanted = state.onScreen && isFinePointer()
      if (wanted === state.attached) return
      state.attached = wanted
      if (wanted) document.addEventListener("pointermove", onMove, { passive: true })
      else {
        document.removeEventListener("pointermove", onMove)
        end()
      }
    }
    const view = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      state.onScreen = entry?.isIntersecting ?? true
      sync()
    })
    view?.observe(root)
    const media = window.matchMedia("(hover: hover) and (pointer: fine)")
    media.addEventListener?.("change", sync)
    document.documentElement.addEventListener("pointerleave", end)
    sync()
    return () => {
      view?.disconnect()
      media.removeEventListener?.("change", sync)
      document.documentElement.removeEventListener("pointerleave", end)
      document.removeEventListener("pointermove", onMove)
    }
  }, [rootRef, move, end, enabled])
}

export interface MagnetOptions {
  reach: number
  strength: number
  maxOffset: number
  sticky: boolean
}

/** The values live in motion values, so a pointer stream re-renders nothing except when the latch flips. */
export function useMagnetForce(rootRef: React.RefObject<HTMLElement | null>, { reach, strength, maxOffset, sticky }: MagnetOptions) {
  const targetX = useMotionValue(0)
  const targetY = useMotionValue(0)
  const targetNear = useMotionValue(0)
  const x = useSpring(targetX, FOLLOW_SPRING)
  const y = useSpring(targetY, FOLLOW_SPRING)
  const near = useSpring(targetNear, FOLLOW_SPRING)
  const latchedRef = useRef(false)
  const [latched, setLatched] = useState(false)

  const setLatch = useCallback((next: boolean) => {
    if (next === latchedRef.current) return
    latchedRef.current = next
    setLatched(next)
  }, [])

  const end = useCallback(() => {
    setLatch(false)
    targetX.set(0)
    targetY.set(0)
    targetNear.set(0)
  }, [setLatch, targetNear, targetX, targetY])

  const move = useCallback(
    (point: Point) => {
      const root = rootRef.current
      if (!root) return
      const box = root.getBoundingClientRect()
      const distance = distanceToBox(point, box)
      const hold = sticky && nextLatched(latchedRef.current, distance, reach * 0.15, reach * 0.6)
      if (sticky) setLatch(hold)
      const falloff = hold ? 1 : magnetFalloff(distance, reach)
      // Far away and already at rest, which is nearly every event on a long page.
      if (falloff === 0 && targetX.get() === 0 && targetY.get() === 0 && targetNear.get() === 0) return
      const pull = magnetPull(point, box, hold ? LATCHED_STRENGTH : strength, falloff, hold ? maxOffset * 2 : maxOffset)
      targetX.set(pull.x)
      targetY.set(pull.y)
      targetNear.set(falloff)
    },
    [maxOffset, reach, rootRef, setLatch, sticky, strength, targetNear, targetX, targetY],
  )

  return { x, y, near, latched, move, end }
}
