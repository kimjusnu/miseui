import { useEffect, useRef, useState } from "react"
import { edgeDistances, sameEdges, NO_EDGES, type EdgeDistances, type ScrollAxis } from "@/registry/miseui/ui/scroll-shadow-math"

/** How long `none-at-rest` keeps its shadows after the last scroll event. */
const REST_AFTER_MS = 700

interface ScrollEdges {
  edges: EdgeDistances
  /** True during a scroll and shortly after it. */
  scrolling: boolean
}

/** The element arrives through a callback ref held in state, so this works for a child passed with asChild too. */
function useScrollEdges(node: HTMLElement | null, axis: ScrollAxis): ScrollEdges {
  const [edges, setEdges] = useState<EdgeDistances>(NO_EDGES)
  const [scrolling, setScrolling] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!node) return
    const measure = () => {
      const rtl = getComputedStyle(node).direction === "rtl"
      const next = edgeDistances(node, axis, rtl)
      setEdges((previous) => (sameEdges(previous, next) ? previous : next))
    }
    const onScroll = () => {
      measure()
      setScrolling(true)
      if (timer.current !== null) clearTimeout(timer.current)
      timer.current = setTimeout(() => setScrolling(false), REST_AFTER_MS)
    }
    node.addEventListener("scroll", onScroll, { passive: true })
    // A resize of the box or of what is inside changes the edges without a single scroll event.
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure)
    resize?.observe(node)
    const watchChildren = () => Array.from(node.children).forEach((child) => resize?.observe(child))
    watchChildren()
    const mutation =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(() => {
            watchChildren()
            measure()
          })
    mutation?.observe(node, { childList: true })
    queueMicrotask(measure)
    return () => {
      node.removeEventListener("scroll", onScroll)
      resize?.disconnect()
      mutation?.disconnect()
      if (timer.current !== null) clearTimeout(timer.current)
    }
  }, [node, axis])
  return { edges, scrolling }
}

export { useScrollEdges, REST_AFTER_MS }
