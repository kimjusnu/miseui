import type * as React from "react"
import { useLayoutEffect, useRef } from "react"
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react"
import { SPRING_DEFAULT, clampUnit } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

const THUMB_CLASS =
  "pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.35)]"

interface DragOptions {
  disabled: boolean
  onMove: (x: number, y: number) => void
}

/**
 * Pointer capture keeps the drag alive outside the element, and the thumb goes wherever the pointer is.
 * `jump` is true only between press and first move: it is the one moment a spring is allowed to run.
 */
function usePointerDrag({ disabled, onMove }: DragOptions) {
  const jumpRef = useRef(false)
  const report = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    onMove(clampUnit((event.clientX - rect.left) / rect.width), clampUnit((event.clientY - rect.top) / rect.height))
  }
  const handlers = {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (disabled || event.button !== 0) return
      event.currentTarget.setPointerCapture(event.pointerId)
      // A touch does not focus on its own, and the arrow keys should pick up where the hand left off.
      event.currentTarget.focus({ preventScroll: true })
      jumpRef.current = true
      report(event)
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
      jumpRef.current = false
      report(event)
    },
    onPointerUp: () => {
      jumpRef.current = false
    },
    onPointerCancel: () => {
      jumpRef.current = false
    },
  }
  return { jumpRef, handlers }
}

/** Follows `percent` exactly, unless this change came from a press that jumped and the spring effect is on. */
function useThumbAxis(percent: number, jumpRef: React.RefObject<boolean>, spring: boolean) {
  const reduceMotion = useReducedMotion() ?? false
  const position = useMotionValue(percent)
  useLayoutEffect(() => {
    if (spring && !reduceMotion && jumpRef.current) {
      const controls = animate(position, percent, SPRING_DEFAULT)
      // The first move of a drag lands here and stops the spring, which hands the thumb back to the pointer.
      return () => controls.stop()
    }
    position.set(percent)
  }, [percent, position, spring, reduceMotion, jumpRef])
  return useTransform(position, (value) => `${value}%`)
}

interface ColorAreaProps {
  hue: number
  saturation: number
  brightness: number
  thumbColor: string
  disabled: boolean
  spring: boolean
  label?: string
  onChange: (saturation: number, brightness: number) => void
}

const KEY_PERCENT = 0.01
const SHIFT_PERCENT = 0.1

function ColorArea({ hue, saturation, brightness, thumbColor, disabled, spring, label = "Saturation and brightness", onChange }: ColorAreaProps) {
  const { jumpRef, handlers } = usePointerDrag({ disabled, onMove: (x, y) => onChange(x, 1 - y) })
  const left = useThumbAxis(saturation * 100, jumpRef, spring)
  const top = useThumbAxis((1 - brightness) * 100, jumpRef, spring)
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return
    const unit = event.shiftKey ? SHIFT_PERCENT : KEY_PERCENT
    const moves: Record<string, [number, number] | undefined> = {
      ArrowLeft: [saturation - unit, brightness],
      ArrowRight: [saturation + unit, brightness],
      ArrowUp: [saturation, brightness + unit],
      ArrowDown: [saturation, brightness - unit],
    }
    const move = moves[event.key]
    if (!move) return
    event.preventDefault()
    jumpRef.current = false
    onChange(clampUnit(move[0]), clampUnit(move[1]))
  }
  const saturationPercent = Math.round(saturation * 100)
  const brightnessPercent = Math.round(brightness * 100)
  return (
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-disabled={disabled || undefined}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={saturationPercent}
      aria-valuetext={`Saturation ${saturationPercent}%, brightness ${brightnessPercent}%`}
      data-slot="color-picker-area"
      className="relative h-40 w-full cursor-crosshair touch-none rounded-md outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-disabled:pointer-events-none"
      style={{ backgroundImage: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue} 100% 50%))` }}
      onKeyDown={onKeyDown}
      {...handlers}
    >
      <span aria-hidden="true" className="absolute inset-0 rounded-[inherit] ring-1 ring-foreground/10 ring-inset" />
      <motion.span aria-hidden="true" className={THUMB_CLASS} style={{ left, top, backgroundColor: thumbColor }} />
    </div>
  )
}

interface ColorTrackProps {
  label: string
  value: number
  min?: number
  max: number
  valueText: string
  background: string
  thumbColor: string
  disabled: boolean
  spring: boolean
  slot: string
  onChange: (value: number) => void
}

const TRACK_KEY_STEP = 1
const TRACK_LARGE_STEP = 10

function ColorTrack({ label, value, min = 0, max, valueText, background, thumbColor, disabled, spring, slot, onChange }: ColorTrackProps) {
  const range = max - min
  const set = (next: number) => onChange(Math.min(max, Math.max(min, next)))
  const { jumpRef, handlers } = usePointerDrag({ disabled, onMove: (x) => set(min + x * range) })
  const left = useThumbAxis(((value - min) / range) * 100, jumpRef, spring)
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return
    const unit = event.shiftKey ? TRACK_LARGE_STEP : TRACK_KEY_STEP
    const moves: Record<string, number | undefined> = {
      ArrowLeft: value - unit,
      ArrowDown: value - unit,
      ArrowRight: value + unit,
      ArrowUp: value + unit,
      PageDown: value - TRACK_LARGE_STEP,
      PageUp: value + TRACK_LARGE_STEP,
      Home: min,
      End: max,
    }
    const move = moves[event.key]
    if (move === undefined) return
    event.preventDefault()
    jumpRef.current = false
    set(move)
  }
  return (
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-disabled={disabled || undefined}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      aria-valuetext={valueText}
      data-slot={slot}
      className={cn(
        "relative h-3 w-full cursor-ew-resize touch-none rounded-full outline-none select-none pointer-coarse:h-4",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-disabled:pointer-events-none",
        // Taller to the pointer than to the eye: 28 px with a mouse, 40 px under a thumb.
        "before:absolute before:inset-x-0 before:-inset-y-2 pointer-coarse:before:-inset-y-3",
      )}
      style={{ background }}
      onKeyDown={onKeyDown}
      {...handlers}
    >
      <span aria-hidden="true" className="absolute inset-0 rounded-[inherit] ring-1 ring-foreground/10 ring-inset" />
      <motion.span aria-hidden="true" className={cn(THUMB_CLASS, "top-1/2")} style={{ left, backgroundColor: thumbColor }} />
    </div>
  )
}

export { ColorArea, ColorTrack, usePointerDrag }
