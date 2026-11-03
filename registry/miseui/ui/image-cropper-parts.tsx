import type * as React from "react"
import type { CropCorner, CropRect } from "@/registry/miseui/ui/image-cropper-math"
import { cn } from "@/registry/miseui/lib/utils"

type CropFrameVariant = "free" | "square" | "circle" | "wide"

/** Black and white in both themes: this sits on a photo, and the page's colours mean nothing there. */
const DIM_CLASS = "shadow-[0_0_0_9999px_rgb(0_0_0/0.55)]"
const FRAME_CLASS: Record<CropFrameVariant, string> = {
  free: "ring-1 ring-white/90",
  square: "ring-1 ring-white/90",
  circle: "rounded-full ring-1 ring-white/90",
  wide: "border-y border-white/70",
}

const CORNER_NAME: Record<CropCorner, string> = { nw: "top left", ne: "top right", sw: "bottom left", se: "bottom right" }
const CORNER_CURSOR: Record<CropCorner, string> = { nw: "cursor-nwse-resize", ne: "cursor-nesw-resize", sw: "cursor-nesw-resize", se: "cursor-nwse-resize" }
/** Two thin bars make the L, turned to face the frame's own corner. */
const CORNER_MARK: Record<CropCorner, string> = {
  nw: "top-1/2 left-1/2 border-t-2 border-l-2",
  ne: "top-1/2 right-1/2 border-t-2 border-r-2",
  sw: "bottom-1/2 left-1/2 border-b-2 border-l-2",
  se: "bottom-1/2 right-1/2 border-b-2 border-r-2",
}

const THIRDS = ["33.333%", "66.666%"]

function ThirdsGrid() {
  return (
    <div data-slot="image-cropper-thirds" aria-hidden="true" className="absolute inset-0">
      {THIRDS.map((at) => (
        <span key={`v${at}`} className="absolute inset-y-0 w-px bg-white/40" style={{ left: at }} />
      ))}
      {THIRDS.map((at) => (
        <span key={`h${at}`} className="absolute inset-x-0 h-px bg-white/40" style={{ top: at }} />
      ))}
    </div>
  )
}

function CropFrame({ frame, variant, guides }: { frame: CropRect; variant: CropFrameVariant; guides: boolean }) {
  return (
    <div
      data-slot="image-cropper-frame"
      aria-hidden="true"
      className={cn("pointer-events-none absolute", DIM_CLASS, FRAME_CLASS[variant])}
      style={{ left: frame.x, top: frame.y, width: frame.width, height: frame.height }}
    >
      {guides && (variant === "square" || variant === "free") ? <ThirdsGrid /> : null}
    </div>
  )
}

type CornerHandleProps = React.ComponentProps<"button"> & {
  corner: CropCorner
  frame: CropRect
}

/** 24 px is enough for a mouse; a finger gets the full 40 px without the mark growing. */
function CornerHandle({ corner, frame, className, ...props }: CornerHandleProps) {
  const left = corner.endsWith("w") ? frame.x : frame.x + frame.width
  const top = corner.startsWith("n") ? frame.y : frame.y + frame.height
  return (
    <button
      type="button"
      data-slot="image-cropper-corner"
      data-corner={corner}
      aria-label={`Resize crop from the ${CORNER_NAME[corner]} corner`}
      className={cn("absolute size-6 -translate-x-1/2 -translate-y-1/2 touch-none rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-white pointer-coarse:size-10", CORNER_CURSOR[corner], className)}
      style={{ left, top }}
      {...props}
    >
      <span aria-hidden="true" className={cn("absolute size-3 border-white", CORNER_MARK[corner])} />
    </button>
  )
}

export { CornerHandle, CropFrame, type CropFrameVariant }
