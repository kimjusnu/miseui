import type * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useMotionValue } from "motion/react"
import { atScrollEnd, currentSection, readingLine, sectionProgress, type SectionBox, type SectionIndexItem } from "@/registry/miseui/ui/section-index-math"

/** How long a pressed section holds the index if the browser never reports the end of the scroll. */
const JUMP_LOCK_MS = 1200

interface SectionIndexOptions {
  scrollRef?: React.RefObject<HTMLElement | null>
  /** Space kept above a section after a jump, such as a sticky header's height, in px. */
  scrollOffset: number
  reduceMotion: boolean
}

function readBoxes(ids: readonly string[]): readonly SectionBox[] {
  return ids.map((id) => {
    const box = document.getElementById(id)?.getBoundingClientRect()
    return { top: box?.top ?? Number.POSITIVE_INFINITY, height: box?.height ?? 0 }
  })
}

function readViewport(root: HTMLElement | null) {
  if (root) {
    const metrics = { scrollTop: root.scrollTop, clientHeight: root.clientHeight, scrollHeight: root.scrollHeight }
    return { top: root.getBoundingClientRect().top, height: root.clientHeight, metrics }
  }
  const page = document.documentElement
  return { top: 0, height: window.innerHeight, metrics: { scrollTop: page.scrollTop, clientHeight: page.clientHeight, scrollHeight: page.scrollHeight } }
}

/** Which section is being read and how far through it. Unlike a heading tracker it watches whole sections, which is what gives it a position inside one. */
function useSectionIndex(items: readonly SectionIndexItem[], { scrollRef, scrollOffset, reduceMotion }: SectionIndexOptions) {
  const [current, setCurrent] = useState(-1)
  const progress = useMotionValue(0)
  const lockedRef = useRef(false)
  const timerRef = useRef<number | undefined>(undefined)
  const idKey = items.map((item) => item.id).join(" ")

  useEffect(() => {
    const ids = idKey ? idKey.split(" ") : []
    const root = scrollRef?.current ?? null
    const measure = () => {
      const boxes = readBoxes(ids)
      const { top, height, metrics } = readViewport(root)
      const line = readingLine(top, height)
      const end = atScrollEnd(metrics.scrollTop, metrics.clientHeight, metrics.scrollHeight)
      const next = currentSection(boxes, line, end)
      progress.set(end ? 1 : sectionProgress(boxes[next], line))
      if (!lockedRef.current) setCurrent(next)
    }
    const scroller: EventTarget = root ?? window
    const release = () => {
      lockedRef.current = false
    }
    scroller.addEventListener("scroll", measure, { passive: true })
    scroller.addEventListener("scrollend", release)
    window.addEventListener("resize", measure)
    queueMicrotask(measure)
    return () => {
      scroller.removeEventListener("scroll", measure)
      scroller.removeEventListener("scrollend", release)
      window.removeEventListener("resize", measure)
    }
  }, [idKey, scrollRef, progress])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const goTo = useCallback(
    (index: number) => {
      const target = document.getElementById(items[index]?.id ?? "")
      if (!target) return
      // While a smooth scroll passes other sections the index would run through them, so it holds on the destination.
      lockedRef.current = true
      window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        lockedRef.current = false
      }, JUMP_LOCK_MS)
      setCurrent(index)
      const root = scrollRef?.current
      const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth"
      const top = target.getBoundingClientRect().top - scrollOffset
      if (root) root.scrollTo({ top: root.scrollTop + top - root.getBoundingClientRect().top, behavior })
      else window.scrollTo({ top: window.scrollY + top, behavior })
      // Without this, Tab continues from the index instead of from the section someone just jumped to.
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1")
      target.focus({ preventScroll: true })
    },
    [items, scrollRef, scrollOffset, reduceMotion],
  )

  return { current, progress, goTo }
}

export { useSectionIndex }
