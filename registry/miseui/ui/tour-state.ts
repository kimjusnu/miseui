import type * as React from "react"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import { findStep, isInViewport, padRect, type TourPlacement, type TourRect, type TourSize } from "@/registry/miseui/ui/tour-math"

type TourTarget = string | React.RefObject<HTMLElement | null>

interface TourStep {
  /** A CSS selector or a ref. Leave it out for a step about the whole page. */
  target?: TourTarget
  title: React.ReactNode
  body?: React.ReactNode
  placement?: TourPlacement
}

interface UseTourOptions {
  steps: readonly TourStep[]
  initialStep: number
  padding: number
  onStepChange?: (index: number) => void
  onFinish?: () => void
  onClose: () => void
}

/**
 * Long enough for a smooth scroll to land. Geometry reported within it is part of moving to the step and may
 * spring; after it, the only way a target moves is the person scrolling, and the highlight must stick to it.
 */
const MOVE_WINDOW_MS = 700
const UNRESOLVED = -2

function resolveTarget(target: TourTarget | undefined): HTMLElement | null {
  if (!target) return null
  if (typeof target !== "string") return target.current
  try {
    return document.querySelector<HTMLElement>(target)
  } catch {
    // A selector the browser refuses is the same as a target that is not there.
    return null
  }
}

function isAvailable(step: TourStep) {
  return !step.target || resolveTarget(step.target) !== null
}

function viewportSize(): TourSize {
  return { width: window.innerWidth, height: window.innerHeight }
}

function elementRect(element: HTMLElement): TourRect {
  const { left, top, width, height } = element.getBoundingClientRect()
  return { x: left, y: top, width, height }
}

function bringIntoView(element: HTMLElement | null, smooth: boolean) {
  if (!element || isInViewport(elementRect(element), viewportSize())) return
  element.scrollIntoView({ block: "center", inline: "nearest", behavior: smooth ? "smooth" : "auto" })
}

/** Keyed on the target, not the step: a steps array written inline is new on every render, and its strings are not. */
function useTourPosition(target: TourTarget | undefined, index: number, padding: number) {
  const reduceMotion = useReducedMotion() ?? false
  const [geometry, setGeometry] = useState<{ rect: TourRect | null; viewport: TourSize; moving: boolean }>({
    rect: null,
    viewport: { width: 0, height: 0 },
    moving: false,
  })
  const movingUntil = useRef(0)
  const frame = useRef(0)

  const measure = useCallback(() => {
    const element = resolveTarget(target)
    setGeometry({
      rect: element ? padRect(elementRect(element), padding) : null,
      viewport: viewportSize(),
      moving: performance.now() < movingUntil.current,
    })
  }, [target, padding])

  useLayoutEffect(() => {
    movingUntil.current = performance.now() + MOVE_WINDOW_MS
    bringIntoView(resolveTarget(target), !reduceMotion)
    measure()
  }, [index, target, reduceMotion, measure])

  useEffect(() => {
    const schedule = () => {
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(measure)
    }
    const element = resolveTarget(target)
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule)
    if (element) observer?.observe(element)
    window.addEventListener("resize", schedule)
    // Capture, because scroll does not bubble and the target may sit in any scroller.
    window.addEventListener("scroll", schedule, true)
    return () => {
      cancelAnimationFrame(frame.current)
      observer?.disconnect()
      window.removeEventListener("resize", schedule)
      window.removeEventListener("scroll", schedule, true)
    }
  }, [target, measure])

  return geometry
}

/**
 * Finds the first step once, after mount: a tour open from the start commits together with its targets,
 * so they cannot be found during render. A page with none of them ends the tour instead of opening it empty.
 */
function useFirstStep(options: Pick<UseTourOptions, "steps" | "initialStep" | "onClose">) {
  const [index, setIndex] = useState(UNRESOLVED)
  const [available, setAvailable] = useState<readonly boolean[]>([])
  const first = useRef(options)
  const resolve = useCallback(() => {
    const { steps, initialStep, onClose } = first.current
    const start = findStep(steps, initialStep, 1, isAvailable)
    setAvailable(steps.map(isAvailable))
    setIndex(start)
    if (start === -1) onClose()
  }, [])
  useLayoutEffect(resolve, [resolve])
  return { index, setIndex, available, setAvailable }
}

function useTour({ steps, initialStep, padding, onStepChange, onFinish, onClose }: UseTourOptions) {
  const { index, setIndex, available, setAvailable } = useFirstStep({ steps, initialStep, onClose })
  const [done, setDone] = useState<ReadonlySet<number>>(() => new Set())
  const step = steps[index]
  const geometry = useTourPosition(step?.target, index, padding)
  const shown = steps.flatMap((_, position) => (available[position] ? [position] : []))

  const goTo = (next: number) => {
    // Checked again on every move: the steps before this one may have changed what is on the page.
    setAvailable(steps.map(isAvailable))
    setIndex(next)
    onStepChange?.(next)
  }

  const goNext = () => {
    const next = findStep(steps, index + 1, 1, isAvailable)
    setDone((current) => new Set([...current, index]))
    if (next !== -1) {
      goTo(next)
      return
    }
    onFinish?.()
    onClose()
  }

  const goBack = () => {
    const previous = findStep(steps, index - 1, -1, isAvailable)
    if (previous !== -1) goTo(previous)
  }

  const position = shown.indexOf(index) + 1
  const isLast = shown[shown.length - 1] === index
  return { index, step, done, shown, position, isLast, hasPrevious: position > 1, geometry, goTo, goNext, goBack }
}

export { useTour, type TourStep, type TourTarget }
