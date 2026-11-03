import type * as React from "react"
import { useEffect, useRef } from "react"
import { animate, useMotionValue, useReducedMotion, useTransform, type AnimationPlaybackControls } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { clampShare, clipFor, shareAlong, sweepFrames, type BeforeAfterVariant } from "@/registry/miseui/ui/before-after-geometry"

const SWEEP_REACH = 14
const SWEEP_SECONDS = 1.4

export function useComparison(variant: BeforeAfterVariant, value: number | undefined, defaultValue: number, onValueChange: ((share: number) => void) | undefined) {
  const reduceMotion = useReducedMotion() ?? false
  const handleRef = useRef<HTMLDivElement>(null)
  const running = useRef<AnimationPlaybackControls | null>(null)
  const share = useMotionValue(clampShare(value ?? defaultValue))
  const cross = useMotionValue(50)
  const clip = useTransform([share, cross], ([s = 0, c = 0]) => clipFor(variant, s as number, c as number))

  // Written to the DOM rather than state, so a drag does not re-render both versions on every frame.
  const report = (next: number) => {
    handleRef.current?.setAttribute("aria-valuenow", String(Math.round(next)))
    onValueChange?.(next)
  }

  const glideTo = (next: number) => {
    running.current?.stop()
    if (reduceMotion) share.set(next)
    else running.current = animate(share, next, SPRING_DEFAULT)
  }

  const trackTo = (next: number) => {
    running.current?.stop()
    share.set(next)
  }

  useEffect(() => {
    if (value === undefined) return
    const next = clampShare(value)
    if (next === share.get()) return
    running.current?.stop()
    if (reduceMotion) share.set(next)
    else running.current = animate(share, next, SPRING_DEFAULT)
    handleRef.current?.setAttribute("aria-valuenow", String(Math.round(next)))
  }, [value, reduceMotion, share])

  useEffect(() => () => running.current?.stop(), [])

  return { handleRef, running, share, cross, clip, reduceMotion, report, glideTo, trackTo }
}

export type Comparison = ReturnType<typeof useComparison>

export function useSweepOnce(frameRef: React.RefObject<HTMLDivElement | null>, comparison: Comparison, enabled: boolean) {
  const { running, share } = comparison
  useEffect(() => {
    const frame = frameRef.current
    if (!enabled || !frame || typeof IntersectionObserver === "undefined") return
    const view = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return
      view.disconnect()
      running.current = animate(share, sweepFrames(share.get(), SWEEP_REACH), { duration: SWEEP_SECONDS, ease: "easeInOut" })
    })
    view.observe(frame)
    return () => view.disconnect()
  }, [enabled, frameRef, running, share])
}

export function useFrameDrag(variant: BeforeAfterVariant, comparison: Comparison) {
  const { share, cross, report, glideTo, trackTo } = comparison
  const dragging = useRef(false)

  const shareAt = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (variant === "curtain") return shareAlong(event.clientY, rect.top, rect.height, share.get())
    return shareAlong(event.clientX, rect.left, rect.width, share.get())
  }
  const followCross = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (variant === "lens") cross.set(shareAlong(event.clientY, rect.top, rect.height, cross.get()))
  }

  return {
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      event.currentTarget.setPointerCapture?.(event.pointerId)
      dragging.current = true
      const next = shareAt(event)
      followCross(event)
      glideTo(next)
      report(next)
    },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
      // A lens follows a mouse with no press, the way a loupe does; a finger has to be down.
      const hovering = variant === "lens" && event.pointerType === "mouse"
      if (!dragging.current && !hovering) return
      const next = shareAt(event)
      followCross(event)
      trackTo(next)
      report(next)
    },
    onPointerUp: () => {
      dragging.current = false
    },
    onPointerCancel: () => {
      dragging.current = false
    },
  }
}
