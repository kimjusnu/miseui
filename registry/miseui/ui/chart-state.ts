import type * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { axisLabelWidth, bandPositions, labelStride, niceTicks, pointPositions, scaleLinear } from "@/registry/miseui/ui/chart-math"

const PLOT_TOP = 8
const AXIS_BOTTOM = 24
const AXIS_RIGHT = 8
const TICK_SPACING = 48

interface CartesianInput {
  width: number
  height: number
  labels: readonly string[]
  values: readonly number[]
  band: boolean
  includeZero: boolean
  format: (value: number) => string
}

function cartesianLayout({ width, height, labels, values, band, includeZero, format }: CartesianInput) {
  const plotHeight = Math.max(1, height - PLOT_TOP - AXIS_BOTTOM)
  const ticks = niceTicks(values, Math.max(2, Math.round(plotHeight / TICK_SPACING)), includeZero)
  const left = Math.max(...ticks.ticks.map((tick) => axisLabelWidth(format(tick)))) + 8
  const plotWidth = Math.max(1, width - left - AXIS_RIGHT)
  const count = labels.length
  const inner = band ? bandPositions(count, plotWidth) : pointPositions(count, plotWidth)
  const y = scaleLinear([ticks.min, ticks.max], [PLOT_TOP + plotHeight, PLOT_TOP])
  const longest = Math.max(0, ...labels.map((label) => label.length))
  return {
    left,
    right: left + plotWidth,
    top: PLOT_TOP,
    bottom: PLOT_TOP + plotHeight,
    plotWidth,
    positions: inner.map((position) => position + left),
    bandWidth: count > 0 ? plotWidth / count : 0,
    ticks: ticks.ticks,
    y,
    baseline: y(Math.min(ticks.max, Math.max(ticks.min, 0))),
    stride: labelStride(count, plotWidth, longest),
    band,
  }
}

type CartesianLayout = ReturnType<typeof cartesianLayout>

/**
 * Measured before paint: ResizeObserver delivers its first entry in the same frame, so a chart
 * never shows at the fallback width. Axis text keeps its size because the SVG is redrawn, not scaled.
 */
function useElementWidth(ref: React.RefObject<HTMLElement | null>, fallback: number) {
  const [width, setWidth] = useState(fallback)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width)
      if (next > 0) setWidth(next)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return width
}

/** Starts seen where the browser cannot tell, so a chart is never stuck undrawn. */
function useSeenOnce(ref: React.RefObject<HTMLElement | null>, enabled: boolean) {
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === "undefined")
  useEffect(() => {
    const element = ref.current
    if (!enabled || seen || !element) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setSeen(true)
      },
      { threshold: 0.3 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, enabled, seen])
  return seen
}

function chartKeyStep(key: string, active: number | null, count: number) {
  if (count === 0) return undefined
  if (key === "Home") return 0
  if (key === "End") return count - 1
  if (key === "Escape") return null
  const from = active ?? -1
  if (key === "ArrowRight" || key === "ArrowDown") return Math.min(count - 1, from + 1)
  if (key === "ArrowLeft" || key === "ArrowUp") return active === null ? 0 : Math.max(0, from - 1)
  return undefined
}

type HitTest = (x: number, y: number) => number | null

function useActivePoint(count: number, hit: HitTest) {
  const [rawActive, setActive] = useState<number | null>(null)
  const [viaKeyboard, setViaKeyboard] = useState(false)
  const pressing = useRef(false)
  const active = rawActive !== null && rawActive < count ? rawActive : null

  const hitFrom = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setActive(hit(event.clientX - rect.left, event.clientY - rect.top))
    setViaKeyboard(false)
  }

  const surface = {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      pressing.current = true
      hitFrom(event)
    },
    onPointerUp: () => {
      pressing.current = false
    },
    onPointerCancel: () => {
      pressing.current = false
      setActive(null)
    },
    onPointerMove: hitFrom,
    // A finger lifting also counts as leaving; on touch the tip stays until the next tap or blur.
    onPointerLeave: (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse") setActive(null)
    },
    onFocus: () => {
      if (pressing.current) return
      setActive((current) => current ?? (count > 0 ? 0 : null))
      setViaKeyboard(true)
    },
    onBlur: () => {
      setActive(null)
      setViaKeyboard(false)
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      const next = chartKeyStep(event.key, active, count)
      if (next === undefined) return
      event.preventDefault()
      setActive(next)
      setViaKeyboard(true)
    },
  }
  return { active, viaKeyboard, surface }
}

export { cartesianLayout, chartKeyStep, useActivePoint, useElementWidth, useSeenOnce, type CartesianLayout }
