import type * as React from "react"
import { useEffect, useRef, useState } from "react"
import { animate, useMotionValue, type AnimationPlaybackControls } from "motion/react"
import { projectMomentum, SPRING_DEFAULT } from "@/registry/miseui/lib/motion"

const GAP_SHARE = 0.12
const MIN_COUNT_FOR_POLYGON = 3
const TWO_ITEM_RADIUS = 0.75
const DRAG_SLOP_PX = 6
const MAX_DIM = 0.72
const LABEL_HIDDEN_FACING = 0.8
const LABEL_SHOWN_FACING = 0.98

/** Positive modulo: the ring has no ends, and JavaScript's % keeps the sign of a negative index. */
export function wrapIndex(index: number, count: number) {
  if (count <= 0) return 0
  return ((index % count) + count) % count
}

/** Degrees between neighbours. */
export function ringStep(count: number) {
  return 360 / Math.max(count, 1)
}

/** Ring radius in item widths: neighbours sit one item and a small gap apart along the chord. */
export function ringRadius(count: number) {
  if (count < MIN_COUNT_FOR_POLYGON) return TWO_ITEM_RADIUS
  return (1 + GAP_SHARE) / 2 / Math.tan(Math.PI / count)
}

/** Item width as a share of the stage, so the ring fits a 263 px cell and a wide page with no measuring. */
export function ringItemShare(count: number) {
  return 100 / (2 * ringRadius(count) + 1)
}

/** 1 at the front of the ring, -1 at the back. */
export function ringFacing(turn: number, index: number, count: number) {
  return Math.cos(((index - turn) * ringStep(count) * Math.PI) / 180)
}

export function ringDim(facing: number) {
  return ((1 - facing) / 2) * MAX_DIM
}

/** Perspective squeezes the name on a turned card into something unreadable, and the caption already says it. */
export function ringLabelOpacity(facing: number) {
  return Math.min(Math.max((facing - LABEL_HIDDEN_FACING) / (LABEL_SHOWN_FACING - LABEL_HIDDEN_FACING), 0), 1)
}

/** The closest whole turn that brings `index` to the front, in whichever direction is shorter. */
export function nearestTurn(turn: number, index: number, count: number) {
  const whole = Math.round(turn)
  const ahead = wrapIndex(index - whole, count)
  return whole + (ahead > count / 2 ? ahead - count : ahead)
}

/** A full stage of drag turns half the ring, whatever its width. */
export function dragToTurns(dragPx: number, stageWidth: number, count: number) {
  if (stageWidth <= 0) return 0
  return (dragPx / stageWidth) * (count / 2)
}

/** Where a released ring lands. Without momentum a flick moves one item at most, so nothing skips past unseen. */
export function settleTurn(turn: number, velocity: number, momentum: boolean, count: number) {
  const reach = momentum ? count : 1
  const projected = Math.max(-reach, Math.min(reach, projectMomentum(velocity)))
  return Math.round(turn + projected)
}

interface RingOptions {
  count: number
  index?: number
  defaultIndex: number
  onIndexChange?: (index: number) => void
  momentum: boolean
  reduceMotion: boolean
}

interface Gesture {
  startX: number
  startTurn: number
  lastX: number
  lastTime: number
  velocity: number
  dragging: boolean
}

export function useRingState({ count, index, defaultIndex, onIndexChange, momentum, reduceMotion }: RingOptions) {
  const [uncontrolled, setUncontrolled] = useState(defaultIndex)
  const active = wrapIndex(index ?? uncontrolled, count)
  const turn = useMotionValue(active)
  const aimed = useRef(active)
  const running = useRef<AnimationPlaybackControls | null>(null)
  const gesture = useRef<Gesture | null>(null)

  const settle = (target: number, velocity = 0) => {
    aimed.current = target
    running.current?.stop()
    if (reduceMotion) turn.set(target)
    else running.current = animate(turn, target, { ...SPRING_DEFAULT, velocity })
  }

  // The motion value is the source of truth for the angle; this only catches up when the index moved some other way.
  useEffect(() => {
    if (wrapIndex(aimed.current, count) === active) return
    const target = nearestTurn(aimed.current, active, count)
    aimed.current = target
    running.current?.stop()
    if (reduceMotion) turn.set(target)
    else running.current = animate(turn, target, SPRING_DEFAULT)
  }, [active, count, reduceMotion, turn])

  useEffect(() => () => running.current?.stop(), [])

  const select = (next: number) => {
    const wrapped = wrapIndex(next, count)
    setUncontrolled(wrapped)
    if (wrapped !== active) onIndexChange?.(wrapped)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const moves: Record<string, number> = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: count - 1 }
    const next = moves[event.key]
    if (next === undefined) return
    event.preventDefault()
    select(next)
  }

  const finish = () => {
    const current = gesture.current
    gesture.current = null
    if (!current?.dragging) return
    const target = settleTurn(turn.get(), current.velocity, momentum, count)
    settle(target, current.velocity)
    select(target)
  }

  const handlers = {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return
      gesture.current = { startX: event.clientX, startTurn: turn.get(), lastX: event.clientX, lastTime: event.timeStamp, velocity: 0, dragging: false }
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      const current = gesture.current
      if (!current) return
      const drag = event.clientX - current.startX
      if (!current.dragging && Math.abs(drag) < DRAG_SLOP_PX) return
      if (!current.dragging) {
        // Captured only once it is a drag, so a plain click still lands on the item under the pointer.
        current.dragging = true
        running.current?.stop()
        event.currentTarget.setPointerCapture?.(event.pointerId)
      }
      const width = event.currentTarget.getBoundingClientRect().width
      const elapsed = event.timeStamp - current.lastTime
      if (elapsed > 0) current.velocity = (-dragToTurns(event.clientX - current.lastX, width, count) / elapsed) * 1000
      current.lastX = event.clientX
      current.lastTime = event.timeStamp
      turn.set(current.startTurn - dragToTurns(drag, width, count))
    },
    onPointerUp: finish,
    onPointerCancel: finish,
  }

  return { active, turn, select, onKeyDown, handlers }
}

export type RingState = ReturnType<typeof useRingState>
