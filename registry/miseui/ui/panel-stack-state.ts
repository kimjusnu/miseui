import { useCallback, useEffect, useRef, useState } from "react"

const PANEL_SELECTOR = "[data-slot='panel-stack-panel']"
/** Trackpads send a stream of tiny deltas after a swipe; this ignores the tail of it. */
const MIN_WHEEL_DELTA = 8
/** One gesture, one panel. Longer than a smooth scroll, or momentum from the same swipe would turn a second page. */
const WHEEL_LOCK_MS = 700
/** Releases the count if something interrupts a smooth scroll before it reaches its target. */
const TARGET_RELEASE_MS = 800

interface WheelInput {
  deltaX: number
  deltaY: number
  index: number
  count: number
  /** The panel under the pointer has its own vertical scroll, which goes first. */
  innerScroll: boolean
}

/**
 * What a wheel event should do: null leaves it alone, 0 swallows it, 1 or -1 turns a page. At the first and last panel
 * it is left alone, or the page around the stack could never be scrolled past it.
 */
function wheelStep({ deltaX, deltaY, index, count, innerScroll }: WheelInput) {
  if (innerScroll || Math.abs(deltaX) >= Math.abs(deltaY)) return null
  const direction = Math.sign(deltaY)
  const next = index + direction
  if (next < 0 || next >= count) return null
  return Math.abs(deltaY) < MIN_WHEEL_DELTA ? 0 : direction
}

function nearestPanel(scrollLeft: number, offsets: readonly number[]) {
  return offsets.reduce((best, offset, index) => (Math.abs(offset - scrollLeft) < Math.abs(offsets[best] - scrollLeft) ? index : best), 0)
}

function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

function panelsIn(track: HTMLElement) {
  return Array.from(track.querySelectorAll<HTMLElement>(PANEL_SELECTOR))
}

/** The track arrives through a callback ref held in state: inside a Radix portal it does not exist yet during the first layout effect. */
function usePanelTrack(count: number, reduceMotion: boolean, wheel: boolean) {
  const [track, setTrack] = useState<HTMLDivElement | null>(null)
  const [index, setIndex] = useState(0)
  const targetRef = useRef<number | null>(null)
  const timerRef = useRef<number | undefined>(undefined)
  const wheelLockRef = useRef(0)

  const goTo = useCallback(
    (next: number) => {
      const panel = track ? panelsIn(track)[next] : undefined
      if (!track || !panel) return
      // Pressing next twice quickly should land two panels on, so the count moves now and the scroll catches up.
      targetRef.current = next
      window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        targetRef.current = null
      }, TARGET_RELEASE_MS)
      setIndex(next)
      track.scrollTo?.({ left: panel.offsetLeft, behavior: reduceMotion ? "auto" : "smooth" })
    },
    [track, reduceMotion],
  )

  useEffect(() => {
    if (!track) return
    const onScroll = () => {
      const next = nearestPanel(track.scrollLeft, panelsIn(track).map((panel) => panel.offsetLeft))
      if (targetRef.current !== null && targetRef.current !== next) return
      targetRef.current = null
      setIndex(next)
    }
    track.addEventListener("scroll", onScroll, { passive: true })
    return () => track.removeEventListener("scroll", onScroll)
  }, [track])

  useEffect(() => {
    if (!track || !wheel) return
    const onWheel = (event: WheelEvent) => {
      const panel = (event.target as Element).closest<HTMLElement>(PANEL_SELECTOR)
      const innerScroll = panel !== null && panel.scrollHeight > panel.clientHeight + 1
      const step = wheelStep({ deltaX: event.deltaX, deltaY: event.deltaY, index, count, innerScroll })
      if (step === null) return
      event.preventDefault()
      if (step === 0 || performance.now() < wheelLockRef.current) return
      wheelLockRef.current = performance.now() + WHEEL_LOCK_MS
      goTo(index + step)
    }
    // Passive is the default for wheel on some elements, and a passive listener cannot stop the page from scrolling.
    track.addEventListener("wheel", onWheel, { passive: false })
    return () => track.removeEventListener("wheel", onWheel)
  }, [track, wheel, index, count, goTo])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  return { setTrack, index, goTo }
}

export { isEditable, nearestPanel, usePanelTrack, wheelStep }
