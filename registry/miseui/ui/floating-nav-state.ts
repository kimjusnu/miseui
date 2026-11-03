import type * as React from "react"
import { useEffect, useState } from "react"

export interface FloatingNavItem {
  value: string
  label: string
  /** Renders a link. Without it the item is a button and only reports the choice. */
  href?: string
  icon?: React.ReactNode
}

export interface ScrollStep {
  hidden: boolean
  lastY: number
}

/** Near the top the nav always shows: the start of a page is where people look for it. */
export const TOP_ZONE_PX = 64
/** Past this the `bar` variant shrinks, so a stray wheel notch at the top does not make it jump. */
export const COMPACT_AFTER_PX = 32
/** Less than this is a trembling finger, not a direction. */
const JITTER_PX = 6

/** Clamped first, because rubber-banding past either end of a page reports a false change of direction. */
export function nextScrollStep(step: ScrollStep, y: number, maxY: number): ScrollStep {
  const clamped = Math.min(Math.max(y, 0), Math.max(maxY, 0))
  if (clamped <= TOP_ZONE_PX) return { hidden: false, lastY: clamped }
  const delta = clamped - step.lastY
  if (Math.abs(delta) < JITTER_PX) return step
  return { hidden: delta > 0, lastY: clamped }
}

function readScroll(element: HTMLElement | null) {
  if (element) return { y: element.scrollTop, maxY: element.scrollHeight - element.clientHeight }
  return { y: window.scrollY, maxY: document.documentElement.scrollHeight - window.innerHeight }
}

/** State only flips when an answer changes, so a scroll stream does not re-render anything. */
export function useNavScroll(scrollContainer: React.RefObject<HTMLElement | null> | undefined, watching: boolean) {
  const [view, setView] = useState({ hidden: false, compact: false })
  useEffect(() => {
    if (!watching) return
    const element = scrollContainer?.current ?? null
    const target: HTMLElement | Window = element ?? window
    const start = readScroll(element)
    const stepRef = { current: { hidden: false, lastY: start.y } as ScrollStep }
    const onScroll = () => {
      const { y, maxY } = readScroll(element)
      stepRef.current = nextScrollStep(stepRef.current, y, maxY)
      const { hidden } = stepRef.current
      const compact = y > COMPACT_AFTER_PX
      setView((previous) => (previous.hidden === hidden && previous.compact === compact ? previous : { hidden, compact }))
    }
    onScroll()
    target.addEventListener("scroll", onScroll, { passive: true })
    return () => target.removeEventListener("scroll", onScroll)
  }, [scrollContainer, watching])
  return view
}
