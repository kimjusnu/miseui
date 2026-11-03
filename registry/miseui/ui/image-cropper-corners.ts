import type * as React from "react"
import { useRef } from "react"
import { NUDGES, NUDGE_FAST_PX, NUDGE_PX } from "@/registry/miseui/ui/image-cropper-gestures"
import { imageRect, intersect, resizeFrame, type CropCorner, type CropPoint, type CropRect, type CropSize } from "@/registry/miseui/ui/image-cropper-math"
import type { CropState } from "@/registry/miseui/ui/image-cropper-state"

const MIN_FRAME_PX = 48

function useCornerResize({ live, commit }: CropState, image: CropSize | null, aspect: number | null, onKeyboardChange: () => void) {
  const start = useRef<{ point: CropPoint; frame: CropRect } | null>(null)

  const apply = (corner: CropCorner, base: CropRect, dx: number, dy: number, lockedShape: boolean) => {
    const geometry = live.current
    if (!geometry || !image) return
    const ratio = aspect ?? (lockedShape ? base.width / base.height : null)
    const bounds = intersect({ x: 0, y: 0, ...geometry.stage }, imageRect(geometry.view, image))
    commit({ ...geometry, frame: resizeFrame(base, corner, dx, dy, bounds, MIN_FRAME_PX, ratio) })
  }

  return (corner: CropCorner) => ({
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0 || !live.current) return
      // The stage underneath would otherwise start panning the picture too.
      event.stopPropagation()
      event.currentTarget.setPointerCapture(event.pointerId)
      start.current = { point: { x: event.clientX, y: event.clientY }, frame: live.current.frame }
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (!start.current) return
      event.stopPropagation()
      apply(corner, start.current.frame, event.clientX - start.current.point.x, event.clientY - start.current.point.y, event.shiftKey)
    },
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
      event.stopPropagation()
      start.current = null
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      const nudge = NUDGES[event.key]
      if (!nudge || !live.current) return
      event.preventDefault()
      event.stopPropagation()
      const step = event.shiftKey ? NUDGE_FAST_PX : NUDGE_PX
      apply(corner, live.current.frame, -nudge.x * step, -nudge.y * step, false)
      onKeyboardChange()
    },
  })
}

export { useCornerResize }
