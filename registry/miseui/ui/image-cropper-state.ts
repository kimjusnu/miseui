import type * as React from "react"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { animate, useMotionValue, type AnimationPlaybackControls } from "motion/react"
import { SPRING_MOMENTUM } from "@/registry/miseui/lib/motion"
import {
  centerView,
  clampView,
  coverScale,
  cropFromView,
  fitFrame,
  sameRect,
  scaleFrame,
  viewFromCrop,
  type CropRect,
  type CropSize,
  type CropView,
} from "@/registry/miseui/ui/image-cropper-math"

interface CropGeometry {
  stage: CropSize
  frame: CropRect
  view: CropView
  /** Different image or shape: the old crop no longer means anything, so start over. */
  key: string
}

interface GeometryInput {
  stage: CropSize
  image: CropSize
  aspect: number | null
  inset: number
  free: boolean
  key: string
  previous: CropGeometry | null
  initial: CropRect | undefined
}

function firstGeometry({ stage, image, aspect, inset, free, key, initial }: GeometryInput): CropGeometry {
  const frame = fitFrame(stage, aspect, inset)
  if (initial) return { stage, frame, key, view: clampView(viewFromCrop(initial, frame), image, frame) }
  // Free starts with the whole picture in view, not just enough of it to fill the frame.
  const whole = { x: 0, y: 0, ...stage }
  return { stage, frame, key, view: centerView(image, free ? whole : frame, free ? coverScale(image, whole) : undefined) }
}

/** A new stage size keeps what was chosen: the same pixels of the image stay inside the frame. */
function nextGeometry(input: GeometryInput): CropGeometry {
  const { stage, image, aspect, inset, free, key, previous } = input
  if (!previous || previous.key !== key) return firstGeometry(input)
  const crop = cropFromView(previous.view, previous.frame, image)
  const frame = free ? scaleFrame(previous.frame, previous.stage, stage) : fitFrame(stage, aspect, inset)
  return { stage, frame, key, view: clampView(viewFromCrop(crop, frame), image, frame) }
}

interface CropperOptions {
  stageRef: React.RefObject<HTMLElement | null>
  image: CropSize | null
  aspect: number | null
  inset: number
  free: boolean
  defaultCrop?: CropRect
  maxZoom: number
  onCropChange?: (crop: CropRect) => void
}

/** Kept in a ref so an inline callback does not re-subscribe the observer on every render. */
function useLatest<Value>(value: Value) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref
}

/** Observed in a layout effect, because the first entry then arrives before the first paint. */
function useStageSize(stageRef: React.RefObject<HTMLElement | null>, enabled: boolean, onSize: (size: CropSize) => void) {
  useLayoutEffect(() => {
    const element = stageRef.current
    if (!element || !enabled || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(([entry]) => {
      const size = { width: Math.round(entry.contentRect.width), height: Math.round(entry.contentRect.height) }
      if (size.width > 0 && size.height > 0) onSize(size)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [stageRef, enabled, onSize])
}

/** The picture's position outside React, so a drag moves it every frame without a render. */
function useCropMotion() {
  const running = useRef<readonly AnimationPlaybackControls[]>([])
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)
  const stop = useCallback(() => {
    running.current.forEach((animation) => animation.stop())
    running.current = []
  }, [])
  const show = useCallback(
    (view: CropView) => {
      x.set(view.x)
      y.set(view.y)
      scale.set(view.scale)
    },
    [x, y, scale],
  )
  const springTo = useCallback(
    (view: CropView) => {
      running.current = [animate(x, view.x, SPRING_MOMENTUM), animate(y, view.y, SPRING_MOMENTUM)]
    },
    [x, y],
  )
  useEffect(() => stop, [stop])
  return { x, y, scale, stop, show, springTo }
}

function useCropGeometry({ stageRef, image, aspect, inset, free, defaultCrop, maxZoom, onCropChange }: CropperOptions) {
  const imageWidth = image?.width ?? 0
  const imageHeight = image?.height ?? 0
  const key = `${imageWidth}x${imageHeight}:${aspect}:${inset}:${free}`
  const [geometry, setGeometry] = useState<CropGeometry | null>(null)
  const live = useRef<CropGeometry | null>(null)
  const report = useLatest(onCropChange)
  const reported = useRef<CropRect | null>(null)
  const initial = useRef(defaultCrop)
  const { x, y, scale, stop, show, springTo } = useCropMotion()

  /** Moves the picture now without settling on it. */
  const preview = useCallback(
    (view: CropView) => {
      if (!live.current) return
      live.current = { ...live.current, view }
      show(view)
    },
    [show],
  )

  const commit = useCallback(
    (next: CropGeometry, options: { spring?: boolean } = {}) => {
      stop()
      live.current = next
      setGeometry(next)
      if (options.spring) springTo(next.view)
      else show(next.view)
      const crop = cropFromView(next.view, next.frame, { width: imageWidth, height: imageHeight })
      if (sameRect(crop, reported.current)) return
      reported.current = crop
      report.current?.(crop)
    },
    [stop, show, springTo, imageWidth, imageHeight, report],
  )

  const measured = useCallback(
    (stage: CropSize) => {
      const previous = live.current
      if (previous?.key === key && previous.stage.width === stage.width && previous.stage.height === stage.height) return
      commit(nextGeometry({ stage, image: { width: imageWidth, height: imageHeight }, aspect, inset, free, key, previous, initial: initial.current }))
    },
    [imageWidth, imageHeight, aspect, inset, free, key, commit],
  )
  useStageSize(stageRef, imageWidth > 0 && imageHeight > 0, measured)

  return { geometry, live, preview, commit, stop, motion: { x, y, scale }, maxZoom }
}

type CropState = ReturnType<typeof useCropGeometry>

/** Draws the crop on a canvas at its real size, for uploading. Throws if the source is cross-origin without CORS: browsers refuse to read those back. */
function cropToBlob(source: CanvasImageSource, crop: CropRect, options: { type?: string; quality?: number } = {}) {
  const canvas = document.createElement("canvas")
  canvas.width = crop.width
  canvas.height = crop.height
  const context = canvas.getContext("2d")
  if (!context) return Promise.reject(new Error("This browser cannot draw to a canvas."))
  context.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The crop could not be encoded."))),
      options.type ?? "image/png",
      options.quality,
    )
  })
}

export { cropToBlob, nextGeometry, useCropGeometry, type CropGeometry, type CropState }
