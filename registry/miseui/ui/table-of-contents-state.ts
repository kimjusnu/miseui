import type * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  atScrollEnd,
  headingStatus,
  nextActive,
  readHeadings,
  sameItems,
  scrollTopFor,
  type HeadingStatus,
  type TocItem,
} from "@/registry/miseui/ui/table-of-contents-math"

/** How long a clicked heading holds the marker if the browser never reports the end of the scroll. */
const CLICK_LOCK_MS = 1200
/** Below this share of the viewport a heading is not yet "the section being read". */
const READING_BAND_BOTTOM = "-60%"

const NO_ITEMS: readonly TocItem[] = []

/** Items win. Otherwise the headings are read from the container and followed as its content changes. */
function useHeadings(items: readonly TocItem[] | undefined, containerRef: React.RefObject<HTMLElement | null> | undefined, selector: string) {
  const [read, setRead] = useState(NO_ITEMS)
  useEffect(() => {
    const container = containerRef?.current
    if (items || !container) return
    let alive = true
    const refresh = () => {
      if (!alive) return
      const next = readHeadings(container, selector)
      setRead((previous) => (sameItems(previous, next) ? previous : next))
    }
    // Attributes are left out of the watch list: reading the headings writes ids, which would wake it forever.
    const observer = new MutationObserver(refresh)
    observer.observe(container, { childList: true, subtree: true, characterData: true })
    queueMicrotask(refresh)
    return () => {
      alive = false
      observer.disconnect()
    }
  }, [items, containerRef, selector])
  return items ?? read
}

interface ActiveOptions {
  scrollRef?: React.RefObject<HTMLElement | null>
  offset: number
  reduceMotion: boolean
}

/** Follows the headings while nothing holds the marker in place. */
function useReadingPosition(
  idKey: string,
  scrollRef: React.RefObject<HTMLElement | null> | undefined,
  offset: number,
  lockedRef: React.RefObject<boolean>,
  setActive: (id: string | null) => void,
) {
  useEffect(() => {
    const ids = idKey ? idKey.split(" ") : []
    if (ids.length === 0) return
    const root = scrollRef?.current ?? null
    const metrics = root ?? document.documentElement
    let statuses: ReadonlyMap<string, HeadingStatus> = new Map()
    const publish = () => {
      if (lockedRef.current) return
      const end = atScrollEnd(metrics.scrollTop, metrics.clientHeight, metrics.scrollHeight)
      setActive(end ? (ids.at(-1) ?? null) : nextActive(ids, statuses))
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const updates = entries.map(
          (entry) => [entry.target.id, headingStatus(entry.isIntersecting, entry.boundingClientRect.top, entry.rootBounds?.top ?? 0)] as const,
        )
        statuses = new Map([...statuses, ...updates])
        publish()
      },
      { root, rootMargin: `-${offset}px 0px ${READING_BAND_BOTTOM} 0px` },
    )
    ids.flatMap((id) => document.getElementById(id) ?? []).forEach((element) => observer.observe(element))
    const scroller: EventTarget = root ?? window
    const release = () => {
      lockedRef.current = false
    }
    scroller.addEventListener("scroll", publish, { passive: true })
    scroller.addEventListener("scrollend", release)
    return () => {
      observer.disconnect()
      scroller.removeEventListener("scroll", publish)
      scroller.removeEventListener("scrollend", release)
    }
  }, [idKey, scrollRef, offset, lockedRef, setActive])
}

function useActiveHeading(ids: readonly string[], { scrollRef, offset, reduceMotion }: ActiveOptions) {
  const [active, setActive] = useState<string | null>(null)
  const lockedRef = useRef(false)
  const timerRef = useRef<number | undefined>(undefined)
  useReadingPosition(ids.join(" "), scrollRef, offset, lockedRef, setActive)
  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const goTo = useCallback(
    (id: string) => {
      const target = document.getElementById(id)
      if (!target) return
      // While a smooth scroll passes other headings the marker would run through them, so it holds on the destination.
      lockedRef.current = true
      window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        lockedRef.current = false
      }, CLICK_LOCK_MS)
      setActive(id)
      const root = scrollRef?.current
      const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth"
      const top = target.getBoundingClientRect().top
      if (root) root.scrollTo({ top: scrollTopFor(top, root.getBoundingClientRect().top, root.scrollTop, offset), behavior })
      else window.scrollTo({ top: scrollTopFor(top, 0, window.scrollY, offset), behavior })
      // Without this, Tab continues from the link instead of from the section someone just jumped to.
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1")
      target.focus({ preventScroll: true })
    },
    [scrollRef, offset, reduceMotion],
  )

  return { active, goTo }
}

export { useActiveHeading, useHeadings }
