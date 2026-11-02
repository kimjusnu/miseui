import type * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { animate, useMotionValue, type MotionValue } from "motion/react"
import { SPRING_DEFAULT, SPRING_MOMENTUM } from "@/registry/miseui/lib/motion"
import {
  clampPosition,
  clampSize,
  dockedX,
  type DockSide,
  type PanelPoint,
  type PanelSize,
} from "@/registry/miseui/ui/floating-panel-math"

interface PanelGeometryOptions {
  boundary?: React.RefObject<HTMLElement | null>
  docked: boolean
  reduceMotion: boolean
  defaultPosition: PanelPoint
  defaultSize: PanelSize
  minSize: PanelSize
  maxSize?: Partial<PanelSize>
}

function readBounds(boundary?: React.RefObject<HTMLElement | null>): PanelSize {
  const element = boundary?.current
  return element ? { width: element.clientWidth, height: element.clientHeight } : { width: window.innerWidth, height: window.innerHeight }
}

function placeAt(x: MotionValue<number>, y: MotionValue<number>, target: PanelPoint) {
  x.set(target.x)
  y.set(target.y)
}

/** Overshoot only in open space: past an edge it would break the promise of staying inside. */
function springTo(x: MotionValue<number>, y: MotionValue<number>, target: PanelPoint, velocity: PanelPoint, free: boolean) {
  const spring = free ? SPRING_MOMENTUM : SPRING_DEFAULT
  animate(x, target.x, { ...spring, velocity: velocity.x })
  animate(y, target.y, { ...spring, velocity: velocity.y })
}

/** Re-fits when the window or the boundary changes size, so a panel is never stranded off screen. */
function useKeepInside(boundary: React.RefObject<HTMLElement | null> | undefined, fit: () => void) {
  useEffect(() => {
    fit()
    window.addEventListener("resize", fit)
    const element = boundary?.current
    const observer = element && typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null
    if (element) observer?.observe(element)
    return () => {
      window.removeEventListener("resize", fit)
      observer?.disconnect()
    }
  }, [boundary, fit])
}

/** Where the panel is and how large, and the rules that keep it on screen. */
function usePanelGeometry(options: PanelGeometryOptions, panelRef: React.RefObject<HTMLDivElement | null>) {
  const { boundary, docked, reduceMotion, defaultPosition, defaultSize, minSize, maxSize } = options
  // Motion values, so a drag moves one to one under the pointer with no React render per frame.
  const x = useMotionValue(defaultPosition.x)
  const y = useMotionValue(defaultPosition.y)
  const width = useMotionValue(defaultSize.width)
  const height = useMotionValue(defaultSize.height)
  const [side, setSide] = useState<DockSide>("right")
  const bounds = useCallback(() => readBounds(boundary), [boundary])
  // The real box where it has one, because `tool` is as wide as its contents and a minimised panel is shorter than `height`.
  const measured = useCallback((): PanelSize => {
    const element = panelRef.current
    return { width: element?.offsetWidth || width.get(), height: element?.offsetHeight || height.get() }
  }, [panelRef, width, height])
  const settle = (target: PanelPoint, velocity?: PanelPoint, free = false) => {
    if (reduceMotion || !velocity) placeAt(x, y, target)
    else springTo(x, y, target, velocity, free)
  }
  const fit = useCallback(() => {
    const area = bounds()
    if (docked) {
      x.set(dockedX(side, measured().width, area.width))
      y.set(0)
      return
    }
    placeAt(x, y, clampPosition({ x: x.get(), y: y.get() }, measured(), area))
  }, [bounds, docked, measured, side, x, y])
  useKeepInside(boundary, fit)
  const resizeTo = (next: PanelSize) => {
    const area = bounds()
    // The right dock grows towards the left and takes its x along.
    const position = docked ? { x: 0, y: 0 } : { x: x.get(), y: y.get() }
    const size = clampSize(next, position, area, minSize, maxSize)
    width.set(size.width)
    height.set(size.height)
    if (docked) x.set(dockedX(side, size.width, area.width))
    return size
  }
  /** Runs before the body opens, so the panel moves up in step with it and never hangs off the bottom edge. */
  const settleForRestore = () => {
    const box = measured()
    const full = { width: box.width, height: box.height + height.get() }
    settle(clampPosition({ x: x.get(), y: y.get() }, full, bounds()), { x: 0, y: 0 })
  }
  return { x, y, width, height, side, setSide, bounds, measured, settle, fit, resizeTo, settleForRestore }
}

function useControllable(value: boolean | undefined, initial: boolean, onChange?: (next: boolean) => void) {
  const [uncontrolled, setUncontrolled] = useState(initial)
  const set = (next: boolean) => {
    setUncontrolled(next)
    onChange?.(next)
  }
  return [value ?? uncontrolled, set] as const
}

/** Remembers where focus came from so closing can put it back, and closes on Escape. */
function usePanelDismiss(setOpen: (open: boolean) => void, closable: boolean) {
  const returnFocus = useRef<HTMLElement | null>(null)
  const close = () => {
    setOpen(false)
    if (returnFocus.current?.isConnected) returnFocus.current.focus()
  }
  const onFocusCapture = (event: React.FocusEvent<HTMLElement>) => {
    const from = event.relatedTarget as HTMLElement | null
    if (from && !event.currentTarget.contains(from)) returnFocus.current = from
  }
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape" && closable) close()
  }
  return { close, onFocusCapture, onKeyDown }
}

/** Reopened on a window that has since shrunk, it must not come back off screen. */
function useFitWhenShown(open: boolean, minimized: boolean, fit: () => void) {
  useEffect(() => {
    if (open) fit()
  }, [open, minimized, fit])
}

type PanelGeometry = ReturnType<typeof usePanelGeometry>

export { useControllable, useFitWhenShown, usePanelDismiss, usePanelGeometry, type PanelGeometry, type PanelGeometryOptions }
