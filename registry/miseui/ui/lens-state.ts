import type * as React from "react"
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import { useLensKeys, useLensPointer } from "@/registry/miseui/ui/lens-gestures"
import {
  lensBodyPosition,
  lensCopyOffset,
  lensFocus,
  lensPointFromFraction,
  lensRegion,
  lensViewSize,
  type LensAnchor,
  type Point,
  type Size,
} from "@/registry/miseui/ui/lens-math"

export type LensVariant = "circle" | "square" | "panel" | "strip"
export type LensEffect = "press"

const GLIDE = "transform var(--duration-slow) var(--ease-mise)"
const ANCHOR: Record<Exclude<LensVariant, "panel">, LensAnchor> = { circle: "centre", square: "above", strip: "band" }

function useMeasuredSize(ref: React.RefObject<HTMLElement | null>, watching: boolean) {
  const [size, setSize] = useState<Size | null>(null)
  useLayoutEffect(() => {
    const element = ref.current
    if (!watching || !element) return
    const read = () => {
      const { width, height } = element.getBoundingClientRect()
      setSize((previous) => (previous?.width === width && previous?.height === height ? previous : { width, height }))
    }
    read()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(read)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, watching])
  return size
}

export interface LensOptions {
  variant: LensVariant
  effect?: LensEffect
  zoom: number
  size: number
  defaultPoint?: Point
}

interface LensLayers {
  body: HTMLElement | null
  copy: HTMLElement | null
  region: HTMLElement | null
}

function paintLens(layers: LensLayers, variant: LensVariant, point: Point, box: Size, view: Size, zoom: number) {
  const focus = lensFocus(point, box, view, zoom)
  const offset = lensCopyOffset(focus, view, zoom)
  if (layers.copy) layers.copy.style.transform = `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`
  if (variant === "panel") {
    const region = lensRegion(focus, view, zoom)
    if (layers.region) {
      layers.region.style.width = `${region.width}px`
      layers.region.style.height = `${region.height}px`
      layers.region.style.transform = `translate(${region.x}px, ${region.y}px)`
    }
    return
  }
  const body = lensBodyPosition(point, box, view, ANCHOR[variant])
  if (layers.body) layers.body.style.transform = `translate(${body.x}px, ${body.y}px)`
}

interface VisibilityOptions {
  paint: () => void
  layers: () => readonly (HTMLElement | null)[]
  pointRef: React.RefObject<Point | null>
  resting: boolean
  initiallyArmed: boolean
}

function useLensVisibility({ paint, layers, pointRef, resting, initiallyArmed }: VisibilityOptions) {
  const reduceMotion = useReducedMotion() ?? false
  const [shown, setShown] = useState(resting)
  const [armed, setArmed] = useState(initiallyArmed)
  const glide = (on: boolean) => {
    const value = on && !reduceMotion ? GLIDE : ""
    layers().forEach((layer) => {
      if (layer) layer.style.transition = value
    })
  }
  const show = (point?: Point) => {
    if (point) pointRef.current = point
    glide(false)
    setArmed(true)
    setShown(true)
    paint()
  }
  /** Leaving glides a lens with a resting place back to it. Otherwise it fades where it stands, and Escape always hides it. */
  const hide = (dismiss = false) => {
    setShown(resting && !dismiss)
    if (!resting) return
    pointRef.current = null
    glide(true)
    paint()
  }
  return { shown, armed, show, hide }
}

/** Sizes and shown state live in React because they rarely change. Position is written straight to the layers. */
export function useLens({ variant, effect, zoom: zoomProp, size, defaultPoint }: LensOptions) {
  const panel = variant === "panel"
  const press = effect === "press"
  const zoom = Math.max(1, zoomProp)
  const contentRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const regionRef = useRef<HTMLDivElement>(null)
  const pointRef = useRef<Point | null>(null)
  const box = useMeasuredSize(contentRef, true)
  const panelSize = useMeasuredSize(panelRef, panel)
  const resting = defaultPoint !== undefined && !press
  const view = useMemo(() => {
    if (!box) return null
    return panel ? panelSize : lensViewSize(ANCHOR[variant as Exclude<LensVariant, "panel">], size, box)
  }, [box, panel, panelSize, size, variant])

  const paint = useCallback(() => {
    if (!box || !view) return
    const point = pointRef.current ?? lensPointFromFraction(defaultPoint, box)
    paintLens({ body: bodyRef.current, copy: copyRef.current, region: regionRef.current }, variant, point, box, view, zoom)
  }, [box, defaultPoint, variant, view, zoom])

  const { shown, armed, show, hide } = useLensVisibility({ paint, layers: () => [bodyRef.current, copyRef.current, regionRef.current], pointRef, resting, initiallyArmed: panel || resting })
  useLayoutEffect(paint, [paint, armed, shown])
  const pointer = useLensPointer({ contentRef, press, shown, show, hide })
  const keys = useLensKeys({ box, pointRef, defaultPoint, show, hide })
  return { contentRef, panelRef, bodyRef, copyRef, regionRef, box, view, zoom, shown, armed: armed && box !== null, pointer, keys }
}
