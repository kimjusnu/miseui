import type * as React from "react"
import { useEffect, useRef, useState } from "react"
import { animate, useMotionValue, type Transition } from "motion/react"
import { projectMomentum, SPRING_DEFAULT } from "@/registry/miseui/lib/motion"

const REWIND_TOTAL_MS = 900
const REWIND_MAX_STEP_MS = 120
const SWIPE_SLOP_PX = 6
const INSTANT: Transition = { duration: 0 }

export function clampIndex(next: number, count: number) {
  return Math.max(0, Math.min(Math.max(count - 1, 0), next))
}

/** Where a released swipe lands. The flick is projected first, so a short fast swipe still turns the slide. */
export function swipeTarget(index: number, offset: number, velocity: number, width: number, count: number) {
  if (width <= 0) return index
  const travel = offset + projectMomentum(velocity)
  if (travel < -width / 2) return clampIndex(index + 1, count)
  if (travel > width / 2) return clampIndex(index - 1, count)
  return index
}

/** A long way back stays under a second, a short one stays readable. */
export function rewindStepMs(distance: number) {
  if (distance <= 0) return 0
  return Math.min(REWIND_MAX_STEP_MS, REWIND_TOTAL_MS / distance)
}

interface DeckOptions {
  count: number
  index?: number
  defaultIndex: number
  onIndexChange?: (index: number) => void
  rewindable: boolean
  reduceMotion: boolean
}

export function useDeckState({ count, index, defaultIndex, onIndexChange, rewindable, reduceMotion }: DeckOptions) {
  const [uncontrolled, setUncontrolled] = useState(defaultIndex)
  const [rewindStep, setRewindStep] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const active = clampIndex(index ?? uncontrolled, count)
  const last = Math.max(count - 1, 0)

  useEffect(() => () => clearTimeout(timer.current), [])

  const commit = (next: number) => {
    setUncontrolled(next)
    onIndexChange?.(next)
  }

  /** Any direct move interrupts a rewind, so the reader is never locked out while it plays. */
  const go = (next: number) => {
    clearTimeout(timer.current)
    setRewindStep(null)
    const target = clampIndex(next, count)
    if (target !== active) commit(target)
  }

  const rewind = () => {
    if (active === 0) return
    if (reduceMotion || !rewindable) {
      go(0)
      return
    }
    const step = rewindStepMs(active)
    const stepTo = (at: number) => {
      commit(at)
      timer.current = setTimeout(() => (at === 0 ? setRewindStep(null) : stepTo(at - 1)), step)
    }
    clearTimeout(timer.current)
    setRewindStep(step)
    stepTo(active - 1)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("input, textarea, select, [contenteditable='true']")) return
    const actions: Record<string, () => void> = {
      ArrowRight: () => go(active + 1),
      ArrowLeft: () => go(active - 1),
      Home: rewind,
      End: () => go(last),
    }
    const action = actions[event.key]
    if (!action) return
    event.preventDefault()
    action()
  }

  let transition: Transition = SPRING_DEFAULT
  if (reduceMotion) transition = INSTANT
  else if (rewindStep !== null) transition = { duration: rewindStep / 1000, ease: "linear" }

  return { active, last, count, go, rewind, onKeyDown, transition, rewinding: rewindStep !== null }
}

export type DeckState = ReturnType<typeof useDeckState>

interface Gesture {
  pointerId: number
  startX: number
  lastX: number
  lastTime: number
  velocity: number
  dragging: boolean
}

function isControl(target: EventTarget) {
  return target instanceof Element && target.closest("a, button, input, select, textarea, label") !== null
}

/** The pointer is captured only after it travels, so a tap on a link inside a slide still counts as a click. */
export function useDeckSwipe(deck: DeckState, reduceMotion: boolean) {
  const dragX = useMotionValue(0)
  const gesture = useRef<Gesture | null>(null)

  const finish = (event: React.PointerEvent<HTMLElement>) => {
    const current = gesture.current
    gesture.current = null
    if (!current?.dragging) return
    const width = event.currentTarget.getBoundingClientRect().width
    deck.go(swipeTarget(deck.active, dragX.get(), current.velocity, width, deck.count))
    if (reduceMotion) dragX.set(0)
    else animate(dragX, 0, SPRING_DEFAULT)
  }

  const handlers = {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0 || isControl(event.target)) return
      gesture.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        lastX: event.clientX,
        lastTime: event.timeStamp,
        velocity: 0,
        dragging: false,
      }
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      const current = gesture.current
      if (!current) return
      const offset = event.clientX - current.startX
      if (!current.dragging && Math.abs(offset) < SWIPE_SLOP_PX) return
      if (!current.dragging) {
        current.dragging = true
        event.currentTarget.setPointerCapture?.(event.pointerId)
      }
      const elapsed = event.timeStamp - current.lastTime
      if (elapsed > 0) current.velocity = ((event.clientX - current.lastX) / elapsed) * 1000
      current.lastX = event.clientX
      current.lastTime = event.timeStamp
      dragX.set(offset)
    },
    onPointerUp: finish,
    onPointerCancel: finish,
  }

  return { dragX, handlers }
}

export type DeckSwipe = ReturnType<typeof useDeckSwipe>
