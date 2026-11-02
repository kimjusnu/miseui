import type * as React from "react"
import { useEffect, useRef } from "react"
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from "motion/react"
import { SPRING_DEFAULT, clampUnit } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type RevealMode = "blur" | "pixelate" | "wipe"

const DEFAULT_MODE: RevealMode = "blur"
const COMPLETE = 1
const PERCENT = 100
/** 24 px of blur hides detail but keeps the composition readable, which is the point. */
const MAX_BLUR_PX = 24
/** A 4 % zoom that settles to 1 reads as the image arriving, not merely sharpening. */
const BLUR_SCALE_RANGE = 0.04
/** The mosaic runs from 6 to 96 cells across. Quadratic growth keeps detail for the end, like a progressive decode. */
const MIN_CELLS = 6
const MAX_CELLS = 96
/** The mosaic dissolves over the final share of progress so the last step is a fade, not a snap. */
const MOSAIC_FADE_SHARE = 0.15
const NO_EFFECT = "none"

/** motion.img owns these; the same names on a plain img would not type-check against it. */
type ImgProps = Omit<
  React.ComponentProps<"img">,
  "src" | "alt" | "style" | "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
>

interface RevealImageProps extends ImgProps {
  src: string
  alt: string
  /** 0..1, how much of the image has arrived. Values outside the range are clamped. 1 shows it plain. */
  progress?: number
  /** blur: soft to sharp. pixelate: coarse mosaic to fine. wipe: left to right. */
  mode?: RevealMode
  /** Applied to the wrapper, together with className. */
  style?: React.CSSProperties
}

function blurFor(progress: number) {
  if (progress >= COMPLETE) return NO_EFFECT
  return `blur(${((1 - progress) * MAX_BLUR_PX).toFixed(2)}px)`
}

function clipFor(progress: number) {
  if (progress >= COMPLETE) return NO_EFFECT
  return `inset(0 ${((1 - progress) * PERCENT).toFixed(2)}% 0 0)`
}

/** Paints the image at mosaic resolution; CSS upscales it with image-rendering: pixelated. */
function drawMosaic(canvas: HTMLCanvasElement | null, image: HTMLImageElement | null, progress: number) {
  if (!canvas || !image || image.naturalWidth === 0) return
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  const cells = Math.round(MIN_CELLS + (MAX_CELLS - MIN_CELLS) * progress * progress)
  const rows = Math.max(1, Math.round((cells * image.naturalHeight) / image.naturalWidth))
  if (canvas.width !== cells || canvas.height !== rows) {
    canvas.width = cells
    canvas.height = rows
  }
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(image, 0, 0, cells, rows)
}

function RevealImage({
  src,
  alt,
  progress = COMPLETE,
  mode = DEFAULT_MODE,
  className,
  style,
  onLoad,
  ...props
}: RevealImageProps) {
  const reduceMotion = useReducedMotion() ?? false
  const target = clampUnit(progress)
  const value = useMotionValue(target)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const softens = mode === "blur" || mode === "pixelate"

  useEffect(() => {
    const controls = animate(value, target, reduceMotion ? { duration: 0 } : SPRING_DEFAULT)
    return () => controls.stop()
  }, [value, target, reduceMotion])

  // Every mode writes all three styles so switching modes leaves no stale effect behind.
  const filter = useTransform(value, (p) => (softens ? blurFor(p) : NO_EFFECT))
  const scale = useTransform(value, (p) => (mode === "blur" ? 1 + (1 - p) * BLUR_SCALE_RANGE : 1))
  const clipPath = useTransform(value, (p) => (mode === "wipe" ? clipFor(p) : NO_EFFECT))
  const mosaicOpacity = useTransform(value, (p) => clampUnit((1 - p) / MOSAIC_FADE_SHARE))

  useMotionValueEvent(value, "change", (p) => {
    if (mode === "pixelate") drawMosaic(canvasRef.current, imageRef.current, p)
  })

  useEffect(() => {
    if (mode === "pixelate") drawMosaic(canvasRef.current, imageRef.current, value.get())
  }, [mode, src, value])

  return (
    <span
      data-slot="reveal-image"
      data-mode={mode}
      data-progress={target}
      data-reduced={reduceMotion ? "true" : "false"}
      className={cn("relative inline-block overflow-hidden align-middle", className)}
      style={style}
    >
      <motion.img
        ref={imageRef}
        src={src}
        alt={alt}
        className="block max-w-full"
        style={{ filter, scale, clipPath }}
        onLoad={(event) => {
          drawMosaic(canvasRef.current, event.currentTarget, value.get())
          onLoad?.(event)
        }}
        {...props}
      />
      {mode === "pixelate" ? (
        <motion.canvas
          ref={canvasRef}
          aria-hidden="true"
          data-testid="reveal-mosaic"
          className="pointer-events-none absolute inset-0 size-full [image-rendering:pixelated]"
          style={{ opacity: mosaicOpacity }}
        />
      ) : null}
    </span>
  )
}

export { RevealImage, type RevealImageProps, type RevealMode }
