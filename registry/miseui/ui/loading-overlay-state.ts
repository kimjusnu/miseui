import type * as React from "react"
import { useEffect, useRef, useState } from "react"

/** Below about 200 ms a wait feels instant; showing anything in that window only adds a flash. */
const DEFAULT_DELAY_MS = 200
/** Once visible it stays long enough to be read as a state, not a flicker. */
const DEFAULT_MIN_VISIBLE_MS = 400

function remainingVisible(shownAt: number, now: number, minVisible: number) {
  return Math.max(0, minVisible - (now - shownAt))
}

interface DelayedOverlayOptions {
  loading: boolean
  delay: number
  minVisible: number
  contentRef: React.RefObject<HTMLElement | null>
}

/**
 * Inert drops focus from whatever is inside the moment it applies, so the focused element has to be noted just
 * before and handed back after. Otherwise a keyboard user lands at the top of the page each time data refreshes.
 */
function useDelayedOverlay({ loading, delay, minVisible, contentRef }: DelayedOverlayOptions) {
  const [shown, setShown] = useState(false)
  const shownAt = useRef(0)
  const focused = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (loading === shown) return
    if (loading) {
      const timer = setTimeout(() => {
        const active = document.activeElement
        focused.current = active instanceof HTMLElement && contentRef.current?.contains(active) ? active : null
        shownAt.current = Date.now()
        setShown(true)
      }, delay)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => setShown(false), remainingVisible(shownAt.current, Date.now(), minVisible))
    return () => clearTimeout(timer)
  }, [loading, shown, delay, minVisible, contentRef])
  useEffect(() => {
    if (shown || !focused.current) return
    const target = focused.current
    focused.current = null
    // If the person has moved on during the wait, their new place wins.
    if (target.isConnected && (document.activeElement === document.body || document.activeElement === null)) target.focus()
  }, [shown])
  return shown
}

export { DEFAULT_DELAY_MS, DEFAULT_MIN_VISIBLE_MS, remainingVisible, useDelayedOverlay }
