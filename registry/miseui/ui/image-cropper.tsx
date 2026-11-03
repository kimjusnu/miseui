import type * as React from "react"
import { useId, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { useCornerResize } from "@/registry/miseui/ui/image-cropper-corners"
import { frameCentre, useCropGestures, useWheelZoom } from "@/registry/miseui/ui/image-cropper-gestures"
import { coverScale, cropFromView, zoomAt, type CropCorner, type CropRect, type CropSize } from "@/registry/miseui/ui/image-cropper-math"
import { CornerHandle, CropFrame, type CropFrameVariant } from "@/registry/miseui/ui/image-cropper-parts"
import { cropToBlob, useCropGeometry, type CropState } from "@/registry/miseui/ui/image-cropper-state"
import { Slider } from "@/registry/miseui/ui/slider"
import { cn } from "@/registry/miseui/lib/utils"

type ImageCropperVariant = CropFrameVariant
type ImageCropperEffect = "spring"

const DEFAULT_MAX_ZOOM = 4
const FRAME_INSET = 16
const CORNERS: readonly CropCorner[] = ["nw", "ne", "sw", "se"]
const ASPECT: Record<ImageCropperVariant, number | null> = { free: null, square: 1, circle: 1, wide: 16 / 9 }
/** Free takes the picture's own shape once it is known, which overrides the fallback here. */
const STAGE_BASE_CLASS = "relative w-full touch-none overflow-hidden rounded-lg bg-muted outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
const STAGE_CLASS: Record<ImageCropperVariant, string> = { free: "aspect-[4/3]", square: "aspect-square", circle: "aspect-square", wide: "aspect-[16/10]" }

interface ImageCropperProps extends Omit<React.ComponentProps<"div">, "children" | "defaultValue"> {
  /** Names the cropper for assistive tech, and the image when `src` is used. */
  label: string
  src?: string
  /** Draw your own picture instead of `src`, at `imageSize`. */
  children?: React.ReactNode
  /** Needed with `children`. With `src` it is read from the file. */
  imageSize?: CropSize
  /** `free` a frame with corners to pull, `square` with thirds while dragging, `circle` for avatars, `wide` a 16:9 band. */
  variant?: ImageCropperVariant
  /** `spring` lets a drag run past an edge with resistance and springs back on release. */
  effect?: ImageCropperEffect
  /** Locks `free` to a shape, as width over height. The other variants have their own. Holding Shift on a corner locks it for one drag. */
  aspect?: number
  defaultCrop?: CropRect
  /** Called when a gesture settles, in the image's own pixels. Always inside the image. */
  onCropChange?: (crop: CropRect) => void
  /** How far past the smallest fit the image can zoom. */
  maxZoom?: number
  disabled?: boolean
  zoomLabel?: string
  hint?: string
}

function ZoomRow({ crop, image, disabled, label }: { crop: CropState; image: CropSize | null; disabled: boolean; label: string }) {
  const { geometry, live, commit, maxZoom } = crop
  const least = geometry && image ? coverScale(image, geometry.frame) : 1
  const current = geometry && image ? cropFromView(geometry.view, geometry.frame, image) : null
  const setZoom = (zoom: number) => {
    const now = live.current
    if (!now || !image) return
    commit({ ...now, view: zoomAt(now.view, least * zoom, frameCentre(now.frame), image, now.frame, maxZoom) })
  }
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Slider
        aria-label={label}
        disabled={disabled || !geometry}
        min={1}
        max={maxZoom}
        step={0.01}
        value={[geometry ? geometry.view.scale / least : 1]}
        formatValue={(zoom) => `${Math.round(zoom * 100)}%`}
        onValueChange={([zoom]) => setZoom(zoom)}
        className="min-w-0 flex-1"
      />
      <p data-slot="image-cropper-size" className="shrink-0 text-[13px] text-muted-foreground tabular-nums">
        {current ? `${current.width} x ${current.height}` : null}
      </p>
    </div>
  )
}

function StageImage({ crop, image, src, label, onLoaded, children }: { crop: CropState; image: CropSize | null; src?: string; label: string; onLoaded: (size: CropSize) => void; children?: React.ReactNode }) {
  if (!image && !src) return null
  const { x, y, scale } = crop.motion
  return (
    <motion.div data-slot="image-cropper-image" className="absolute top-0 left-0" style={{ x, y, scale, originX: 0, originY: 0, width: image?.width, height: image?.height }}>
      {src ? (
        <img
          src={src}
          alt={label}
          draggable={false}
          className="block size-full max-w-none"
          onLoad={(event) => onLoaded({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
        />
      ) : (
        children
      )}
    </motion.div>
  )
}

function ImageCropper({
  label, src, children, imageSize, variant = "square", effect, aspect: aspectProp, defaultCrop, onCropChange,
  maxZoom = DEFAULT_MAX_ZOOM, disabled = false, zoomLabel = "Zoom",
  hint = "Drag to move the image. Arrow keys move the crop, plus and minus zoom.",
  className,
  ...props
}: ImageCropperProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const hintId = useId()
  const reduceMotion = useReducedMotion() ?? false
  const [loaded, setLoaded] = useState<CropSize | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const image = imageSize ?? loaded
  const free = variant === "free"
  const aspect = free ? (aspectProp ?? null) : ASPECT[variant]
  const crop = useCropGeometry({ stageRef, image, aspect, inset: variant === "wide" ? 0 : FRAME_INSET, free, defaultCrop, maxZoom, onCropChange })
  const speak = () => setSpeaking(true)
  const { surface, dragging, overscrolled } = useCropGestures({ crop, image, elastic: effect === "spring" && !reduceMotion, disabled, onKeyboardChange: speak })
  useWheelZoom(crop, stageRef, image, disabled)
  const cornerProps = useCornerResize(crop, image, aspect, speak)
  const { geometry } = crop
  const current = geometry && image ? cropFromView(geometry.view, geometry.frame, image) : null
  return (
    <div data-slot="image-cropper" data-variant={variant} data-effect={effect} data-overscrolled={overscrolled ? "true" : undefined} className={cn("grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-3", disabled && "opacity-50", className)} {...props}>
      <div
        ref={stageRef}
        data-slot="image-cropper-stage"
        role="group"
        aria-roledescription="image cropper"
        aria-label={label}
        aria-describedby={hintId}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? undefined : 0}
        style={free && image ? { aspectRatio: `${image.width} / ${image.height}` } : undefined}
        className={cn(STAGE_BASE_CLASS, STAGE_CLASS[variant], !disabled && (dragging ? "cursor-grabbing" : "cursor-grab"))}
        {...surface}
        onBlur={() => setSpeaking(false)}
      >
        <StageImage crop={crop} image={image} src={src} label={label} onLoaded={setLoaded}>
          {children}
        </StageImage>
        {geometry ? <CropFrame frame={geometry.frame} variant={variant} guides={dragging} /> : null}
        {free && geometry && !disabled ? CORNERS.map((corner) => <CornerHandle key={corner} corner={corner} frame={geometry.frame} {...cornerProps(corner)} />) : null}
      </div>
      <ZoomRow crop={crop} image={image} disabled={disabled} label={zoomLabel} />
      <span id={hintId} className="sr-only">{hint}</span>
      <span data-slot="image-cropper-live" aria-live="polite" className="sr-only">{speaking && current ? `Crop ${current.width} by ${current.height}, at ${current.x}, ${current.y}` : ""}</span>
    </div>
  )
}

export { ImageCropper, cropToBlob, type CropRect, type ImageCropperEffect, type ImageCropperProps, type ImageCropperVariant }
