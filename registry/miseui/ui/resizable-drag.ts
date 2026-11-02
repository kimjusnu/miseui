import type * as React from "react"
import { useRef, useState } from "react"
import type { MotionValue, Transition } from "motion/react"
import { SPRING_MOMENTUM } from "@/registry/miseui/lib/motion"
import {
  FULL,
  addSample,
  clampSize,
  dragBounds,
  flickTarget,
  restingSize,
  stretchSize,
  velocityOf,
  type DragSample,
  type SizeLimits,
} from "@/registry/miseui/ui/resizable-math"

type DragDirection = "horizontal" | "vertical"
type HandlePointerEvent = React.PointerEvent<HTMLElement>

interface DragOptions {
  direction: DragDirection
  limits: SizeLimits
  collapsible: boolean
  disabled: boolean
  handlePx: number
}

interface DragControls {
  live: MotionValue<number>
  reduceMotion: boolean
  commit: (size: number) => void
  stop: () => void
  settle: (size: number, transition?: Transition) => void
  rememberOpen: (size: number) => void
}

interface DragSession {
  pointerId: number
  startPosition: number
  startSize: number
  sign: number
  lengthPx: number
  samples: readonly DragSample[]
}

/** Arrows and pointer travel run the other way in a right-to-left row, where the first pane sits on the right. */
function axisSign(element: Element, direction: DragDirection) {
  return direction === "horizontal" && getComputedStyle(element).direction === "rtl" ? -1 : 1
}

function positionOf(event: HandlePointerEvent, direction: DragDirection) {
  return direction === "horizontal" ? event.clientX : event.clientY
}

function createSession(event: HandlePointerEvent, root: Element, startSize: number, options: DragOptions): DragSession {
  const { direction, handlePx } = options
  const rect = root.getBoundingClientRect()
  const position = positionOf(event, direction)
  return {
    pointerId: event.pointerId,
    startPosition: position,
    startSize,
    sign: axisSign(root, direction),
    lengthPx: (direction === "horizontal" ? rect.width : rect.height) - handlePx,
    samples: [{ position, time: performance.now() }],
  }
}

function rawSize(session: DragSession, position: number) {
  const travelled = ((position - session.startPosition) * session.sign) / Math.max(1, session.lengthPx)
  return session.startSize + travelled * FULL
}

/** Where a release goes. The spring starts at the speed of the hand, so there is no seam between the drag and the settle. */
function releaseTarget(session: DragSession, shown: number, flickable: boolean, limits: SizeLimits) {
  const velocityPx = velocityOf(session.samples, performance.now()) * session.sign
  const flick = flickable ? flickTarget(shown, velocityPx, session.lengthPx, limits) : null
  if (flick === null) return { size: restingSize(shown, session.startSize, limits) }
  const velocity = (velocityPx / Math.max(1, session.lengthPx)) * FULL
  return { size: flick, transition: { ...SPRING_MOMENTUM, velocity } }
}

function useResizeDrag(options: DragOptions, controls: DragControls) {
  const { direction, limits, collapsible, disabled } = options
  const { live, reduceMotion, commit, stop, settle, rememberOpen } = controls
  const session = useRef<DragSession | null>(null)
  const [dragging, setDragging] = useState(false)

  const onPointerDown = (event: HandlePointerEvent) => {
    const root = event.currentTarget.parentElement
    if (disabled || event.button !== 0 || !root) return
    // Capture keeps the drag alive when the pointer outruns the thin handle or leaves the window.
    event.currentTarget.setPointerCapture(event.pointerId)
    stop()
    rememberOpen(live.get())
    session.current = createSession(event, root, live.get(), options)
    setDragging(true)
  }

  const onPointerMove = (event: HandlePointerEvent) => {
    const active = session.current
    if (!active || event.pointerId !== active.pointerId) return
    const position = positionOf(event, direction)
    const raw = rawSize(active, position)
    const bounds = dragBounds(active.startSize, limits)
    live.set(reduceMotion ? clampSize(raw, bounds) : stretchSize(raw, bounds, active.lengthPx))
    session.current = { ...active, samples: addSample(active.samples, { position, time: performance.now() }) }
    commit(clampSize(raw, bounds))
  }

  const finish = (event: HandlePointerEvent, allowFlick: boolean) => {
    const active = session.current
    if (!active || event.pointerId !== active.pointerId) return
    session.current = null
    setDragging(false)
    const { size, transition } = releaseTarget(active, live.get(), allowFlick && collapsible, limits)
    settle(size, transition)
  }

  return {
    dragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: HandlePointerEvent) => finish(event, true),
      onPointerCancel: (event: HandlePointerEvent) => finish(event, false),
      onLostPointerCapture: (event: HandlePointerEvent) => finish(event, false),
    },
  }
}

export { axisSign, useResizeDrag, type DragControls }
