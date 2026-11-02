import type * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/registry/miseui/lib/utils"

type SpinnerVariant = "ring" | "dots" | "bars" | "orbit"
type SpinnerSize = "sm" | "md" | "lg"

const SIZE_CLASS: Record<SpinnerSize, string> = { sm: "size-4", md: "size-6", lg: "size-8" }

const DOT_COUNT = 3
const DOT_SECONDS = 1.1
const DOT_STAGGER_SECONDS = 0.16
const BAR_COUNT = 8
const BAR_SECONDS = 0.8
const BAR_REST_OPACITY = 0.2
const PULSE_SECONDS = 2.4
const PULSE_OPACITY = [1, 0.4, 1]
/** Slower than Tailwind's 1 s turn: a calm ring reads as working, a fast one reads as hurrying. */
const RING_SPIN_CLASS = "animate-spin [animation-duration:900ms]"
const ORBIT_SPIN_CLASS = "animate-spin [animation-duration:1200ms]"

interface ShapeProps {
  moving: boolean
}

function RingShape({ moving }: ShapeProps) {
  return (
    <svg data-slot="spinner-ring" viewBox="0 0 24 24" fill="none" className={cn("size-full", moving && RING_SPIN_CLASS)}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="16 63" />
    </svg>
  )
}

function DotsShape({ moving }: ShapeProps) {
  return (
    <span className="flex size-full items-center justify-between">
      {Array.from({ length: DOT_COUNT }, (_, index) => (
        <motion.span
          key={index}
          data-slot="spinner-dot"
          className="aspect-square w-1/4 rounded-full bg-current"
          initial={{ opacity: moving ? 0.25 : 1 }}
          animate={moving ? { opacity: [0.25, 1, 0.25] } : undefined}
          transition={{ duration: DOT_SECONDS, ease: "easeInOut", repeat: Infinity, delay: index * DOT_STAGGER_SECONDS }}
        />
      ))}
    </span>
  )
}

function BarsShape({ moving }: ShapeProps) {
  return (
    <span className="relative block size-full">
      {Array.from({ length: BAR_COUNT }, (_, index) => {
        const staticOpacity = 1 - (index / BAR_COUNT) * (1 - BAR_REST_OPACITY)
        return (
          <span
            key={index}
            className="absolute inset-0 flex justify-center"
            style={{ transform: `rotate(${(index * 360) / BAR_COUNT}deg)` }}
          >
            <motion.span
              data-slot="spinner-bar"
              className="block h-[28%] w-[10%] rounded-full bg-current"
              initial={{ opacity: moving ? BAR_REST_OPACITY : staticOpacity }}
              animate={moving ? { opacity: [1, BAR_REST_OPACITY] } : undefined}
              transition={{ duration: BAR_SECONDS, ease: "linear", repeat: Infinity, delay: (index * BAR_SECONDS) / BAR_COUNT }}
            />
          </span>
        )
      })}
    </span>
  )
}

function OrbitShape({ moving }: ShapeProps) {
  return (
    <span className="relative block size-full">
      <span className="absolute inset-[12%] rounded-full border border-current opacity-25" />
      <span data-slot="spinner-orbit" className={cn("absolute inset-0 flex items-start justify-center", moving && ORBIT_SPIN_CLASS)}>
        <span className="mt-[2%] aspect-square w-1/5 rounded-full bg-current" />
      </span>
    </span>
  )
}

const SHAPES: Record<SpinnerVariant, (props: ShapeProps) => React.JSX.Element> = {
  ring: RingShape,
  dots: DotsShape,
  bars: BarsShape,
  orbit: OrbitShape,
}

type SpinnerProps = React.ComponentProps<"span"> & {
  /** `ring` an arc on a track, `dots` three in sequence, `bars` eight around a centre, `orbit` one dot circling. */
  variant?: SpinnerVariant
  /** 16, 24 or 32 px. */
  size?: SpinnerSize
  /** What is happening, announced politely to assistive tech. */
  label?: string
  /** Shows the label next to the mark. */
  showLabel?: boolean
}

function Spinner({ variant = "ring", size = "md", label = "Loading", showLabel = false, className, ...props }: SpinnerProps) {
  const reduceMotion = useReducedMotion() ?? false
  const Shape = SHAPES[variant]
  return (
    <span
      role="status"
      data-slot="spinner"
      data-variant={variant}
      data-size={size}
      data-reduced={reduceMotion ? "true" : undefined}
      className={cn("inline-flex items-center gap-2 text-muted-foreground", className)}
      {...props}
    >
      {reduceMotion ? (
        // Opacity only: still says "working" to someone who asked the screen not to move.
        <motion.span
          aria-hidden="true"
          className={cn("block shrink-0", SIZE_CLASS[size])}
          animate={{ opacity: PULSE_OPACITY }}
          transition={{ duration: PULSE_SECONDS, ease: "easeInOut", repeat: Infinity }}
        >
          <Shape moving={false} />
        </motion.span>
      ) : (
        <span aria-hidden="true" className={cn("block shrink-0", SIZE_CLASS[size])}>
          <Shape moving />
        </span>
      )}
      <span className={showLabel ? "text-[13px]" : "sr-only"}>{label}</span>
    </span>
  )
}

export { Spinner, type SpinnerProps, type SpinnerVariant, type SpinnerSize }
