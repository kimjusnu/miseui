import type * as React from "react"
import { useRef } from "react"
import { projectMomentum } from "@/registry/miseui/lib/motion"
import {
  clampPosition,
  dockedX,
  nearestSide,
  type PanelPoint,
  type PanelSize,
} from "@/registry/miseui/ui/floating-panel-math"
import type { PanelGeometry } from "@/registry/miseui/ui/floating-panel-state"

const KEY_STEP_PX = 16
const KEY_STEP_LARGE_PX = 48
const ARROWS: Record<string, PanelPoint> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
}

interface PanelGestureOptions {
  docked: boolean
  momentum: boolean
  reduceMotion: boolean
  onPositionChange?: (position: PanelPoint) => void
  onSizeChange?: (size: PanelSize) => void
}

interface GestureStart {
  pointerX: number
  pointerY: number
  startX: number
  startY: number
  startWidth: number
  startHeight: number
}

function usePanelMove(geometry: PanelGeometry, options: PanelGestureOptions, gesture: React.RefObject<GestureStart | null>) {
  const { x, y, measured, bounds, settle, setSide } = geometry
  const { docked, momentum, reduceMotion, onPositionChange } = options
  const onMove = (event: React.PointerEvent<HTMLElement>) => {
    const start = gesture.current
    if (!start) return
    const next = clampPosition(
      { x: start.startX + event.clientX - start.pointerX, y: start.startY + event.clientY - start.pointerY },
      measured(),
      bounds(),
    )
    x.set(next.x)
    y.set(next.y)
  }
  const onMoveEnd = () => {
    if (!gesture.current) return
    gesture.current = null
    const size = measured()
    const area = bounds()
    const velocity = { x: x.getVelocity(), y: y.getVelocity() }
    const here = { x: x.get(), y: y.get() }
    if (docked) {
      const side = nearestSide(here.x, size.width, area.width)
      const target = { x: dockedX(side, size.width, area.width), y: 0 }
      setSide(side)
      settle(target, velocity)
      onPositionChange?.(target)
    } else if (momentum && !reduceMotion) {
      const thrown = { x: here.x + projectMomentum(velocity.x), y: here.y + projectMomentum(velocity.y) }
      const target = clampPosition(thrown, size, area)
      settle(target, velocity, target.x === thrown.x && target.y === thrown.y)
      onPositionChange?.(target)
    } else {
      onPositionChange?.(here)
    }
  }
  const onMoveKeyDown = (event: React.KeyboardEvent) => {
    const arrow = ARROWS[event.key]
    if (!arrow || docked) return
    event.preventDefault()
    const step = event.shiftKey ? KEY_STEP_LARGE_PX : KEY_STEP_PX
    const next = clampPosition({ x: x.get() + arrow.x * step, y: y.get() + arrow.y * step }, measured(), bounds())
    x.set(next.x)
    y.set(next.y)
    onPositionChange?.(next)
  }
  return { onMove, onMoveEnd, onMoveKeyDown }
}

function usePanelResize(geometry: PanelGeometry, options: PanelGestureOptions, gesture: React.RefObject<GestureStart | null>) {
  const { width, height, side, resizeTo } = geometry
  const { docked, onSizeChange } = options
  // The handle of a right dock sits on its left edge, so pulling left makes it wider.
  const sign = docked && side === "right" ? -1 : 1
  const onResize = (event: React.PointerEvent<HTMLElement>) => {
    const start = gesture.current
    if (!start) return
    resizeTo({
      width: start.startWidth + (event.clientX - start.pointerX) * sign,
      height: docked ? start.startHeight : start.startHeight + event.clientY - start.pointerY,
    })
  }
  const onResizeEnd = () => {
    if (!gesture.current) return
    gesture.current = null
    onSizeChange?.({ width: width.get(), height: height.get() })
  }
  const onResizeKeyDown = (event: React.KeyboardEvent) => {
    const arrow = ARROWS[event.key]
    if (!arrow) return
    event.preventDefault()
    const step = event.shiftKey ? KEY_STEP_LARGE_PX : KEY_STEP_PX
    const next = {
      width: width.get() + arrow.x * step * sign,
      height: docked ? height.get() : height.get() + arrow.y * step,
    }
    onSizeChange?.(resizeTo(next))
  }
  return { onResize, onResizeEnd, onResizeKeyDown }
}

function usePanelGestures(geometry: PanelGeometry, options: PanelGestureOptions) {
  const { x, y, width, height } = geometry
  const gesture = useRef<GestureStart | null>(null)
  const begin = (event: React.PointerEvent<HTMLElement>) => {
    // Capture keeps the moves coming when a fast pointer outruns the panel or leaves the window.
    event.currentTarget.setPointerCapture?.(event.pointerId)
    x.stop()
    y.stop()
    gesture.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: x.get(),
      startY: y.get(),
      startWidth: width.get(),
      startHeight: height.get(),
    }
  }
  const onMoveStart = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return
    begin(event)
  }
  const move = usePanelMove(geometry, options, gesture)
  const resize = usePanelResize(geometry, options, gesture)
  return { ...move, ...resize, begin, onMoveStart }
}

type PanelGestures = ReturnType<typeof usePanelGestures>

export { usePanelGestures, type PanelGestures }
