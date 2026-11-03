import type * as React from "react"
import { useEffect, useRef, useState } from "react"
import { clampView, dragView, zoomAt, type CropPoint, type CropRect, type CropSize, type CropView } from "@/registry/miseui/ui/image-cropper-math"
import type { CropGeometry, CropState } from "@/registry/miseui/ui/image-cropper-state"

const WHEEL_SENSITIVITY = 0.0015
const KEY_ZOOM = 1.1
const NUDGE_PX = 4
const NUDGE_FAST_PX = 16

const NUDGES: Record<string, CropPoint> = {
  ArrowLeft: { x: 1, y: 0 },
  ArrowRight: { x: -1, y: 0 },
  ArrowUp: { x: 0, y: 1 },
  ArrowDown: { x: 0, y: -1 },
}

type Gesture = { kind: "drag"; start: CropPoint; view: CropView } | { kind: "pinch"; distance: number; middle: CropPoint; view: CropView }

const midpoint = (a: CropPoint, b: CropPoint) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
const distanceBetween = (a: CropPoint, b: CropPoint) => Math.hypot(a.x - b.x, a.y - b.y)
const sameView = (a: CropView, b: CropView) => a.x === b.x && a.y === b.y && a.scale === b.scale
const frameCentre = (frame: CropRect) => ({ x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 })

function gestureFrom(points: readonly CropPoint[], view: CropView): Gesture | null {
  if (points.length === 0) return null
  if (points.length === 1) return { kind: "drag", start: points[0], view }
  return { kind: "pinch", distance: distanceBetween(points[0], points[1]), middle: midpoint(points[0], points[1]), view }
}

interface FollowContext {
  image: CropSize
  frame: CropRect
  elastic: boolean
  maxZoom: number
}

function viewDuring(gesture: Gesture, points: readonly CropPoint[], { image, frame, elastic, maxZoom }: FollowContext): CropView | null {
  if (gesture.kind === "drag") {
    if (!points[0]) return null
    return dragView(gesture.view, points[0].x - gesture.start.x, points[0].y - gesture.start.y, image, frame, elastic)
  }
  if (!points[1]) return null
  const middle = midpoint(points[0], points[1])
  const scale = gesture.view.scale * (distanceBetween(points[0], points[1]) / Math.max(1, gesture.distance))
  const moved = { ...gesture.view, x: gesture.view.x + middle.x - gesture.middle.x, y: gesture.view.y + middle.y - gesture.middle.y }
  return zoomAt(moved, scale, middle, image, frame, maxZoom)
}

function viewForKey(event: Pick<KeyboardEvent, "key" | "shiftKey">, geometry: CropGeometry, image: CropSize, maxZoom: number): CropView | null {
  const nudge = NUDGES[event.key]
  if (nudge) {
    const step = event.shiftKey ? NUDGE_FAST_PX : NUDGE_PX
    return dragView(geometry.view, nudge.x * step, nudge.y * step, image, geometry.frame)
  }
  const factor = event.key === "+" || event.key === "=" ? KEY_ZOOM : event.key === "-" ? 1 / KEY_ZOOM : null
  if (factor === null) return null
  return zoomAt(geometry.view, geometry.view.scale * factor, frameCentre(geometry.frame), image, geometry.frame, maxZoom)
}

/** React attaches wheel listeners as passive, and a passive one cannot stop the page scrolling behind the crop. */
function useWheelZoom({ live, commit, maxZoom }: CropState, stageRef: React.RefObject<HTMLElement | null>, image: CropSize | null, disabled: boolean) {
  useEffect(() => {
    const element = stageRef.current
    if (!element || disabled) return
    const onWheel = (event: WheelEvent) => {
      const geometry = live.current
      if (!geometry || !image) return
      event.preventDefault()
      const rect = element.getBoundingClientRect()
      const next = geometry.view.scale * Math.exp(-event.deltaY * WHEEL_SENSITIVITY)
      commit({ ...geometry, view: zoomAt(geometry.view, next, { x: event.clientX - rect.left, y: event.clientY - rect.top }, image, geometry.frame, maxZoom) })
    }
    element.addEventListener("wheel", onWheel, { passive: false })
    return () => element.removeEventListener("wheel", onWheel)
  }, [stageRef, disabled, live, image, commit, maxZoom])
}

interface GestureOptions {
  crop: CropState
  image: CropSize | null
  /** Lets a drag run past the edges and springs it back on release. */
  elastic: boolean
  disabled: boolean
  onKeyboardChange: () => void
}

const local = (event: React.PointerEvent<HTMLElement>) => {
  const rect = event.currentTarget.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

/** Only a release past the edge travels; a plain drag has already landed where it should. */
function settle({ live, commit, maxZoom }: CropState, image: CropSize | null, elastic: boolean) {
  const geometry = live.current
  if (!geometry || !image) return
  const view = clampView(geometry.view, image, geometry.frame, maxZoom)
  commit({ ...geometry, view }, { spring: elastic && !sameView(view, geometry.view) })
}

function keyMove(event: React.KeyboardEvent<HTMLElement>, { live, commit, maxZoom }: CropState, image: CropSize | null, onChange: () => void) {
  const geometry = live.current
  if (!geometry || !image) return
  const next = viewForKey(event, geometry, image, maxZoom)
  if (!next) return
  event.preventDefault()
  commit({ ...geometry, view: next })
  onChange()
}

function useCropGestures({ crop, image, elastic, disabled, onKeyboardChange }: GestureOptions) {
  const pointers = useRef(new Map<number, CropPoint>())
  const gesture = useRef<Gesture | null>(null)
  const [dragging, setDragging] = useState(false)
  const [overscrolled, setOverscrolled] = useState(false)
  const { live, preview, stop, maxZoom } = crop

  const restart = () => {
    gesture.current = live.current ? gestureFrom([...pointers.current.values()], live.current.view) : null
  }
  const follow = () => {
    const geometry = live.current
    const next = gesture.current && geometry && image ? viewDuring(gesture.current, [...pointers.current.values()], { image, frame: geometry.frame, elastic, maxZoom }) : null
    if (!next || !geometry || !image) return
    preview(next)
    setOverscrolled(!sameView(next, clampView(next, image, geometry.frame)))
  }
  const onPointerEnd = (event: React.PointerEvent<HTMLElement>) => {
    if (!pointers.current.delete(event.pointerId)) return
    restart()
    if (pointers.current.size > 0) return
    setDragging(false)
    setOverscrolled(false)
    settle(crop, image, elastic)
  }
  const surface = {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (disabled || event.button !== 0) return
      event.currentTarget.setPointerCapture(event.pointerId)
      stop()
      pointers.current.set(event.pointerId, local(event))
      restart()
      setDragging(true)
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (!pointers.current.has(event.pointerId)) return
      pointers.current.set(event.pointerId, local(event))
      follow()
    },
    onPointerUp: onPointerEnd,
    onPointerCancel: onPointerEnd,
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      if (disabled || event.target !== event.currentTarget) return
      keyMove(event, crop, image, onKeyboardChange)
    },
  }
  return { surface, dragging, overscrolled }
}

export { NUDGES, NUDGE_FAST_PX, NUDGE_PX, frameCentre, useCropGestures, useWheelZoom }
