import { motion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { arcDash, circumferenceOf, litCells, VIEW_SIZE } from "@/registry/miseui/ui/progress-circular-math"
import { cn } from "@/registry/miseui/lib/utils"

const CENTER = VIEW_SIZE / 2
const TOP_ANGLE = -90
/** The gauge starts at 7:30 and ends at 4:30, leaving the bottom quarter open. */
const GAUGE_START_ANGLE = 135
const GAUGE_SPAN = 0.75
const INDETERMINATE_ARC = 0.25
const CELL_GAP = 5
const SPIN_CLASS = "animate-spin origin-center [animation-duration:1100ms] [transform-box:view-box]"
const SWEEP_SECONDS = 1.6
const CELL_PULSE_SECONDS = 1.2
const REDUCED_PULSE_SECONDS = 2.4
const TRACK_CLASS = "stroke-input/70"
const FILL_CLASS = "stroke-mise"
const TIMED_FILL_CLASS = "duration-(--duration-base) ease-(--ease-mise) motion-reduce:transition-none"

type CircularVariant = "ring" | "thin" | "gauge" | "segmented"

const STROKE_WIDTH: Record<CircularVariant, number> = { ring: 8, thin: 2.5, gauge: 8, segmented: 8 }

interface CircleProps {
  strokeWidth: number
  className?: string
  strokeLinecap?: "round" | "butt"
  transform?: string
  strokeDasharray?: string
}

function baseCircle({ strokeWidth, strokeLinecap = "round", ...rest }: CircleProps) {
  return {
    cx: CENTER,
    cy: CENTER,
    r: (VIEW_SIZE - strokeWidth) / 2,
    fill: "none",
    strokeWidth,
    strokeLinecap,
    ...rest,
  }
}

interface MarkProps {
  variant: CircularVariant
  percent: number | null
  steps: number
  spring: boolean
  reduceMotion: boolean
}

function ArcTrack({ variant }: { variant: CircularVariant }) {
  const strokeWidth = STROKE_WIDTH[variant]
  const circumference = circumferenceOf(strokeWidth)
  if (variant !== "gauge") return <circle {...baseCircle({ strokeWidth, className: TRACK_CLASS })} />
  return (
    <circle
      {...baseCircle({
        strokeWidth,
        className: TRACK_CLASS,
        strokeDasharray: arcDash(GAUGE_SPAN, circumference),
        transform: `rotate(${GAUGE_START_ANGLE} ${CENTER} ${CENTER})`,
      })}
    />
  )
}

function ArcFill({ variant, percent, spring, reduceMotion }: Omit<MarkProps, "percent" | "steps"> & { percent: number }) {
  const strokeWidth = STROKE_WIDTH[variant]
  const circumference = circumferenceOf(strokeWidth)
  const span = variant === "gauge" ? GAUGE_SPAN : 1
  const dash = arcDash((percent / 100) * span, circumference)
  const angle = variant === "gauge" ? GAUGE_START_ANGLE : TOP_ANGLE
  const shared = baseCircle({ strokeWidth, transform: `rotate(${angle} ${CENTER} ${CENTER})` })
  // A zero-length dash with round caps still paints a dot, so an empty arc is hidden.
  const opacity = percent > 0 ? 1 : 0
  if (spring && !reduceMotion) {
    return (
      <motion.circle
        {...shared}
        data-slot="progress-circular-fill"
        className={FILL_CLASS}
        initial={false}
        animate={{ strokeDasharray: dash, opacity }}
        transition={SPRING_DEFAULT}
      />
    )
  }
  return (
    <circle
      {...shared}
      data-slot="progress-circular-fill"
      className={cn(FILL_CLASS, "transition-[stroke-dasharray]", TIMED_FILL_CLASS)}
      style={{ strokeDasharray: dash, opacity }}
    />
  )
}

function Cells({ percent, steps, spring, reduceMotion }: Omit<MarkProps, "variant">) {
  const strokeWidth = STROKE_WIDTH.segmented
  const circumference = circumferenceOf(strokeWidth)
  const cellLength = Math.max(1, circumference / steps - CELL_GAP)
  const lit = percent === null ? 0 : litCells(percent, steps)
  return Array.from({ length: steps }, (_, index) => {
    const angle = TOP_ANGLE + (index * 360) / steps + (CELL_GAP / 2 / circumference) * 360
    const shared = baseCircle({
      strokeWidth,
      strokeLinecap: "butt",
      strokeDasharray: `${cellLength} ${circumference}`,
      transform: `rotate(${angle} ${CENTER} ${CENTER})`,
    })
    const on = index < lit
    return (
      <g key={index} data-slot="progress-circular-cell" data-on={on ? "true" : undefined}>
        <circle {...shared} className={TRACK_CLASS} />
        {percent === null ? (
          <motion.circle
            {...shared}
            className={FILL_CLASS}
            initial={{ opacity: 0 }}
            animate={reduceMotion ? { opacity: index % 3 === 0 ? 0.6 : 0 } : { opacity: [0, 1, 0] }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: CELL_PULSE_SECONDS, repeat: Infinity, delay: (index * CELL_PULSE_SECONDS) / steps }
            }
          />
        ) : spring && !reduceMotion ? (
          <motion.circle {...shared} className={FILL_CLASS} initial={false} animate={{ opacity: on ? 1 : 0 }} transition={SPRING_DEFAULT} />
        ) : (
          <circle {...shared} className={cn(FILL_CLASS, "transition-opacity", TIMED_FILL_CLASS)} style={{ opacity: on ? 1 : 0 }} />
        )}
      </g>
    )
  })
}

function IndeterminateArc({ variant, reduceMotion }: Pick<MarkProps, "variant" | "reduceMotion">) {
  const strokeWidth = STROKE_WIDTH[variant]
  const circumference = circumferenceOf(strokeWidth)
  const dash = arcDash(INDETERMINATE_ARC * (variant === "gauge" ? GAUGE_SPAN : 1), circumference)
  const angle = variant === "gauge" ? GAUGE_START_ANGLE : TOP_ANGLE
  const shared = baseCircle({ strokeWidth, strokeDasharray: dash, transform: `rotate(${angle} ${CENTER} ${CENTER})`, className: FILL_CLASS })
  if (reduceMotion) {
    return (
      <motion.g
        data-slot="progress-circular-pulse"
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: REDUCED_PULSE_SECONDS, ease: "easeInOut", repeat: Infinity }}
      >
        <circle {...shared} />
      </motion.g>
    )
  }
  if (variant === "gauge") {
    // A full turn would cross the open quarter, so the arc runs along the gauge and back.
    const travel = GAUGE_SPAN * (1 - INDETERMINATE_ARC) * circumference
    return (
      <motion.circle
        {...shared}
        data-slot="progress-circular-sweep"
        animate={{ strokeDashoffset: [0, -travel] }}
        transition={{ duration: SWEEP_SECONDS, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
      />
    )
  }
  return (
    <g data-slot="progress-circular-spin" className={SPIN_CLASS}>
      <circle {...shared} />
    </g>
  )
}

function CircularMarks({ variant, percent, steps, spring, reduceMotion }: MarkProps) {
  if (variant === "segmented") return <Cells percent={percent} steps={steps} spring={spring} reduceMotion={reduceMotion} />
  return (
    <>
      <ArcTrack variant={variant} />
      {percent === null ? (
        <IndeterminateArc variant={variant} reduceMotion={reduceMotion} />
      ) : (
        <ArcFill variant={variant} percent={percent} spring={spring} reduceMotion={reduceMotion} />
      )}
    </>
  )
}

export { CircularMarks, type CircularVariant }
