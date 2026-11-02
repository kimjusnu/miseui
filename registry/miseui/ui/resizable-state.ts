import type * as React from "react"
import { useEffect, useRef, useState } from "react"
import { animate, useMotionValue, useReducedMotion, type Transition } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { axisSign, useResizeDrag, type DragControls } from "@/registry/miseui/ui/resizable-drag"
import { FULL, sizeForKey, type SizeLimits } from "@/registry/miseui/ui/resizable-math"

type ResizableDirection = "horizontal" | "vertical"

interface ResizeOptions {
  direction: ResizableDirection
  size: number | undefined
  defaultSize: number
  limits: SizeLimits
  step: number
  collapsible: boolean
  disabled: boolean
  handlePx: number
  onSizeChange?: (size: number) => void
}

function useSizeState({ size, defaultSize, onSizeChange }: ResizeOptions) {
  const reduceMotion = useReducedMotion() ?? false
  const [uncontrolled, setUncontrolled] = useState(defaultSize)
  const current = size ?? uncontrolled
  // Painted size. Separate from `current` because it runs past the limits mid-drag and between frames of a spring.
  const live = useMotionValue(current)
  const requested = useRef(current)
  const animation = useRef<ReturnType<typeof animate> | null>(null)
  const lastOpen = useRef(defaultSize)

  const commit = (next: number) => {
    requested.current = next
    if (next === current) return
    setUncontrolled(next)
    onSizeChange?.(next)
  }
  const stop = () => animation.current?.stop()
  const jump = (next: number) => {
    stop()
    live.set(next)
    commit(next)
  }
  const settle = (next: number, transition: Transition = SPRING_DEFAULT) => {
    commit(next)
    stop()
    if (reduceMotion) live.set(next)
    else animation.current = animate(live, next, transition)
  }
  /** What Enter restores. Taken before a pane collapses, because a flick has already dragged the size away by then. */
  const rememberOpen = (next: number) => {
    if (next > 0 && next < FULL) lastOpen.current = next
  }
  const openSize = () => lastOpen.current

  // No dependency list on purpose: a parent that ignores onSizeChange changes nothing, and has to win all the same.
  useEffect(() => {
    if (requested.current === current) return
    requested.current = current
    animation.current?.stop()
    live.set(current)
  })
  useEffect(() => () => animation.current?.stop(), [])

  return { current, live, reduceMotion, commit, stop, jump, settle, rememberOpen, openSize }
}

function useResizeControl(options: ResizeOptions) {
  const { direction, defaultSize, limits, step, collapsible, disabled } = options
  const state = useSizeState(options)
  const { current, live, jump, settle, rememberOpen, openSize } = state
  const controls: DragControls = state
  const { dragging, handlers } = useResizeDrag(options, controls)
  const collapsed = current <= 0 || current >= FULL

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (disabled) return
    const sign = axisSign(event.currentTarget, direction)
    const next = sizeForKey({ key: event.key, horizontal: direction === "horizontal", sign, current, step, limits })
    if (next !== null) {
      event.preventDefault()
      jump(next)
      return
    }
    if (event.key !== "Enter") return
    event.preventDefault()
    if (!collapsible) {
      settle(defaultSize)
    } else if (collapsed) {
      settle(openSize())
    } else {
      rememberOpen(current)
      settle(0)
    }
  }

  const onDoubleClick = () => {
    if (!disabled) settle(defaultSize)
  }

  return { current, live, dragging, handlers: { ...handlers, onKeyDown, onDoubleClick } }
}

export { useResizeControl, type ResizableDirection }
