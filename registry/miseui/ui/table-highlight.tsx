import type * as React from "react"
import { useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"

const ROW_SELECTOR = "tbody tr:not([data-slot='table-empty'])"

interface HighlightState {
  y: number
  height: number
  width: number
  visible: boolean
  /** The first row after a pause gets no slide, or the band would fly in from wherever it last stood. */
  arriving: boolean
}

const HIDDEN: HighlightState = { y: 0, height: 0, width: 0, visible: false, arriving: true }

/** Measured against the scroller, so a `<div>` never has to sit inside the `<table>`. */
function measure(row: Element, scroller: HTMLElement) {
  const rowRect = row.getBoundingClientRect()
  const scrollerRect = scroller.getBoundingClientRect()
  return { y: rowRect.top - scrollerRect.top + scroller.scrollTop, height: rowRect.height, width: scroller.scrollWidth }
}

function useRowHighlight(enabled: boolean) {
  const [state, setState] = useState<HighlightState>(HIDDEN)
  if (!enabled) return { state, handlers: undefined }
  const moveTo = (target: EventTarget, scroller: HTMLElement) => {
    const row = target instanceof Element ? target.closest(ROW_SELECTOR) : null
    if (!row) return
    const next = measure(row, scroller)
    setState((current) => {
      if (current.visible && current.y === next.y && current.height === next.height) return current
      return { ...next, visible: true, arriving: !current.visible }
    })
  }
  const hide = () => setState((current) => (current.visible ? { ...current, visible: false } : current))
  const handlers = {
    onPointerOver: (event: React.PointerEvent<HTMLDivElement>) => {
      // A finger has no hover: the band would stick to the last row tapped.
      if (event.pointerType !== "touch") moveTo(event.target, event.currentTarget)
    },
    onPointerLeave: hide,
    onFocus: (event: React.FocusEvent<HTMLDivElement>) => moveTo(event.target, event.currentTarget),
    onBlur: (event: React.FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) hide()
    },
  }
  return { state, handlers }
}

function RowHighlight({ state }: { state: HighlightState }) {
  const reduceMotion = useReducedMotion() ?? false
  const slide = state.arriving || reduceMotion ? { duration: 0 } : SPRING_DEFAULT
  return (
    <motion.div
      aria-hidden="true"
      data-slot="table-highlight"
      data-visible={state.visible ? "true" : undefined}
      className="pointer-events-none absolute top-0 left-0 z-0 min-w-full bg-accent"
      style={{ width: state.width }}
      initial={false}
      animate={{ y: state.y, height: state.height, opacity: state.visible ? 1 : 0 }}
      transition={{ y: slide, height: slide, opacity: SPRING_DEFAULT }}
    />
  )
}

export { RowHighlight, useRowHighlight }
