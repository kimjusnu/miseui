import type * as React from "react"
import { useLayoutEffect, useRef, useState } from "react"
import { animate, useMotionValue, useReducedMotion, type AnimationPlaybackControls, type MotionValue } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import {
  dialRotation,
  dragValue,
  isFullCircle,
  pointerToAngle,
  pressValue,
  shortestDelta,
  snapToStep,
  stepValue,
  type DialRange,
} from "@/registry/miseui/ui/angle-slider-math"

interface UseDialOptions {
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  onValueCommit?: (value: number) => void
  range: DialRange
  step: number
  pageStep: number
  wrap: boolean
  disabled: boolean
  spring: boolean
}

function pointerAngle(event: React.PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect()
  return pointerToAngle(event.clientX, event.clientY, rect.left + rect.width / 2, rect.top + rect.height / 2)
}

function keyTargets(value: number, { range, step, pageStep, wrap }: Pick<UseDialOptions, "range" | "step" | "pageStep" | "wrap">) {
  const by = (delta: number) => () => stepValue(value, delta, range, step, wrap)
  // On a full circle the top of the range is the same spot as the bottom, so End stops one step short of it.
  const end = wrap && isFullCircle(range) ? range.max - step : range.max
  return {
    ArrowRight: by(step),
    ArrowUp: by(step),
    ArrowLeft: by(-step),
    ArrowDown: by(-step),
    PageUp: by(pageStep),
    PageDown: by(-pageStep),
    Home: () => range.min,
    End: () => snapToStep(end, step, range.min),
  } as Record<string, (() => number) | undefined>
}

/** The one spring on a dial: from a press to where the press landed. Anything else cancels it. */
function useDialJump(rotation: MotionValue<number>, range: DialRange) {
  const running = useRef<AnimationPlaybackControls | null>(null)
  useLayoutEffect(() => () => running.current?.stop(), [])

  const stop = () => {
    running.current?.stop()
    running.current = null
  }

  const start = (next: number) => {
    stop()
    const from = rotation.get()
    const target = dialRotation(next, range)
    // A full circle takes the short way round; a gauge has a gap it must never cross.
    const to = isFullCircle(range) ? from + shortestDelta(from, target) : target
    running.current = animate(rotation, to, {
      ...SPRING_DEFAULT,
      onComplete: () => {
        running.current = null
      },
    })
  }

  return { running, start, stop }
}

interface DialDragOptions extends Pick<UseDialOptions, "range" | "step" | "wrap" | "disabled" | "spring" | "onValueCommit"> {
  rotation: MotionValue<number>
  latest: React.RefObject<number>
  jump: ReturnType<typeof useDialJump>
  report: (next: number) => void
}

/** Pointer capture carries the drag outside the dial. Only the press may spring; every move lands exactly. */
function useDialDrag({ range, step, wrap, disabled, spring, onValueCommit, rotation, latest, jump, report }: DialDragOptions) {
  const reduceMotion = useReducedMotion() ?? false
  const dragging = useRef(false)

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (disabled || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.focus({ preventScroll: true })
    // Focus would otherwise be taken away again by the browser's default for a press on a non-input.
    event.preventDefault()
    dragging.current = true
    const next = pressValue(pointerAngle(event), range, step, wrap)
    if (spring && !reduceMotion) jump.start(next)
    report(next)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!dragging.current) return
    jump.stop()
    const next = dragValue({ angle: pointerAngle(event), previous: latest.current, range, step, wrap })
    rotation.set(dialRotation(next, range))
    report(next)
  }

  const endDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (!dragging.current) return
    dragging.current = false
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    onValueCommit?.(latest.current)
  }

  return { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag }
}

function useDial(options: UseDialOptions) {
  const { value: controlled, defaultValue, onValueChange, onValueCommit, range, disabled } = options
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? range.min)
  const value = controlled ?? uncontrolled
  const rotation = useMotionValue(dialRotation(value, range))
  const latest = useRef(value)
  const jump = useDialJump(rotation, range)
  const { running } = jump

  const report = (next: number) => {
    latest.current = next
    setUncontrolled(next)
    if (next !== value) onValueChange?.(next)
  }

  // Follows every change unless a press spring is on its way to that same value: then this would cut it short.
  useLayoutEffect(() => {
    latest.current = value
    if (!running.current) rotation.set(dialRotation(value, range))
  }, [value, range, rotation, running])

  const drag = useDialDrag({ ...options, rotation, latest, jump, report })

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const target = disabled ? undefined : keyTargets(value, options)[event.key]
    if (!target) return
    event.preventDefault()
    jump.stop()
    const next = target()
    report(next)
    onValueCommit?.(next)
  }

  return { value, rotation, handlers: { ...drag, onKeyDown } }
}

export { useDial }
