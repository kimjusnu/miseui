import type * as React from "react"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"

type SnapAlign = "start" | "center"

const POSITION_VAR = "--carousel-position"
const ARRIVED_TOLERANCE = 0.01

/** The scrollLeft at which a slide sits snapped. Clamped, because the last slides may not be able to scroll that far. */
function snapStop(left: number, width: number, viewWidth: number, maxScroll: number, align: SnapAlign) {
  const raw = align === "center" ? left - (viewWidth - width) / 2 : left
  return Math.min(Math.max(raw, 0), Math.max(maxScroll, 0))
}

/** Fractional slide position for a scroll offset: 1.5 is halfway from the second slide to the third. */
function scrollPosition(stops: readonly number[], scrollLeft: number) {
  const next = stops.findIndex((stop) => stop > scrollLeft)
  if (next === -1) return Math.max(stops.length - 1, 0)
  if (next === 0) return 0
  const from = stops[next - 1]
  return next - 1 + (scrollLeft - from) / (stops[next] - from)
}

function readStops(viewport: HTMLElement, align: SnapAlign) {
  const slides = viewport.querySelectorAll<HTMLElement>("[data-slot='carousel-slide']")
  const maxScroll = viewport.scrollWidth - viewport.clientWidth
  return Array.from(slides, (slide) => snapStop(slide.offsetLeft, slide.offsetWidth, viewport.clientWidth, maxScroll, align))
}

function isTextEntry(target: EventTarget) {
  return target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable='true']") !== null
}

interface CarouselStateOptions {
  count: number
  align: SnapAlign
  loop: boolean
  autoplay: boolean
  interval: number
  index?: number
  defaultIndex: number
  onIndexChange?: (index: number) => void
  reduceMotion: boolean
}

interface CarouselRefs {
  rootRef: React.RefObject<HTMLDivElement | null>
  viewportRef: React.RefObject<HTMLDivElement | null>
}

function useActiveSlide({ count, index, defaultIndex, onIndexChange }: CarouselStateOptions) {
  const [uncontrolled, setUncontrolled] = useState(defaultIndex)
  const active = Math.min(Math.max(index ?? uncontrolled, 0), Math.max(count - 1, 0))
  const emitted = useRef(active)
  const onChange = useRef(onIndexChange)
  useEffect(() => {
    onChange.current = onIndexChange
  })
  const setActive = useCallback((next: number) => {
    if (emitted.current === next) return
    emitted.current = next
    setUncontrolled(next)
    onChange.current?.(next)
  }, [])
  /** Takes note of a value the owner set. True when it is news and the scroller still has to catch up. */
  const acknowledge = useCallback((next: number) => {
    if (emitted.current === next) return false
    emitted.current = next
    return true
  }, [])
  return { active, setActive, acknowledge }
}

function useCarouselPosition(options: CarouselStateOptions, { rootRef, viewportRef }: CarouselRefs) {
  const { align, reduceMotion } = options
  const { active, setActive, acknowledge } = useActiveSlide(options)
  const initial = useRef(active)
  // While a button-driven scroll is on its way, the slides it passes must not count as the current one.
  const target = useRef<number | null>(null)
  const scrollToSlide = useCallback((next: number, behavior: ScrollBehavior) => {
    const viewport = viewportRef.current
    if (!viewport) return
    target.current = next
    viewport.scrollTo({ left: readStops(viewport, align)[next] ?? 0, behavior })
  }, [align, viewportRef])
  const goTo = useCallback((next: number) => {
    setActive(next)
    scrollToSlide(next, reduceMotion ? "auto" : "smooth")
  }, [reduceMotion, scrollToSlide, setActive])
  const sync = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const position = scrollPosition(readStops(viewport, align), viewport.scrollLeft)
    // Written straight to the DOM: scroll fires every frame and only transforms depend on this value.
    rootRef.current?.style.setProperty(POSITION_VAR, String(position))
    const nearest = Math.round(position)
    if (target.current !== null) {
      const arrived = nearest === target.current && Math.abs(position - nearest) < ARRIVED_TOLERANCE
      if (!arrived) return
      target.current = null
    }
    setActive(nearest)
  }, [align, rootRef, setActive, viewportRef])
  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (viewport && initial.current > 0) viewport.scrollLeft = readStops(viewport, align)[initial.current] ?? 0
  }, [align, viewportRef])
  useEffect(() => {
    if (acknowledge(active)) scrollToSlide(active, reduceMotion ? "auto" : "smooth")
  }, [acknowledge, active, reduceMotion, scrollToSlide])
  // A finger or a wheel takes over from whatever a button started.
  const release = () => {
    target.current = null
  }
  const onScrollEnd = () => {
    release()
    sync()
  }
  return { active, goTo, sync, release, onScrollEnd }
}

function useCarouselAutoplay(options: CarouselStateOptions, active: number, goTo: (index: number) => void) {
  const { autoplay, reduceMotion, count, interval } = options
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [stopped, setStopped] = useState(false)
  const running = autoplay && !reduceMotion && !hovered && !focused && !stopped && count > 1
  useEffect(() => {
    if (!running) return
    const timer = setTimeout(() => goTo((active + 1) % count), interval)
    return () => clearTimeout(timer)
  }, [running, active, count, interval, goTo])
  return { running, stopped, setStopped, setHovered, setFocused }
}

function useCarouselState(options: CarouselStateOptions, refs: CarouselRefs) {
  const { count, loop } = options
  const { active, goTo, sync, release, onScrollEnd } = useCarouselPosition(options, refs)
  const autoplay = useCarouselAutoplay(options, active, goTo)
  const last = Math.max(count - 1, 0)
  const canStep = (amount: number) => loop || (active + amount >= 0 && active + amount <= last)
  const step = (amount: number) => {
    if (canStep(amount)) goTo((active + amount + count) % count)
  }
  const keys: Record<string, () => void> = {
    ArrowLeft: () => step(-1),
    ArrowRight: () => step(1),
    Home: () => goTo(0),
    End: () => goTo(last),
  }
  const onKeyDown = (event: React.KeyboardEvent) => {
    const action = keys[event.key]
    if (!action || isTextEntry(event.target)) return
    event.preventDefault()
    action()
  }
  return { ...autoplay, active, canStep, step, goTo, onKeyDown, onScroll: sync, onScrollEnd, release }
}

type CarouselState = ReturnType<typeof useCarouselState>

export { scrollPosition, snapStop, useCarouselState, type CarouselState, type SnapAlign }
