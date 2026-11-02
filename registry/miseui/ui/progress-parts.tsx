import { motion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

/** A slow breath across the bar: it says "still working" without competing with the value itself. */
const BAND_SECONDS = 1.6
const BAND_REST_SECONDS = 0.4
const BAND_GRADIENT =
  "linear-gradient(90deg, transparent, color-mix(in oklab, var(--mise-foreground) 35%, transparent), transparent)"
const BAND_OVER_EMPTY_GRADIENT =
  "linear-gradient(90deg, transparent, color-mix(in oklab, var(--mise) 55%, transparent), transparent)"

const SWEEP_SECONDS = 1.4
const SWEEP_BAR_WIDTH_PERCENT = 40
/** x is a share of the bar's own width: -100% parks it just past the left edge and 250% (100 / 40) past the right. */
const SWEEP_KEYFRAMES = ["-100%", "250%"]
const SEGMENT_PULSE_DELAY_SECONDS = 0.14

/** Plain fills follow a value with a short timed transition; the spring is opt-in through `effect`. */
const PLAIN_FILL_CLASS = "transition-[width] duration-(--duration-base) ease-(--ease-mise) motion-reduce:transition-none"

function ProgressBand({ overEmpty = false }: { overEmpty?: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      data-slot="progress-band"
      className="absolute inset-0"
      style={{ backgroundImage: overEmpty ? BAND_OVER_EMPTY_GRADIENT : BAND_GRADIENT }}
      initial={{ x: "-100%" }}
      animate={{ x: "100%" }}
      transition={{ duration: BAND_SECONDS, ease: "easeInOut", repeat: Infinity, repeatDelay: BAND_REST_SECONDS }}
    />
  )
}

interface ProgressFillProps {
  percent: number
  spring: boolean
  band: boolean
  reduceMotion: boolean
}

function ProgressFill({ percent, spring, band, reduceMotion }: ProgressFillProps) {
  const width = `${percent}%`
  const className = "absolute inset-y-0 left-0 overflow-hidden rounded-[inherit] bg-mise"
  if (spring && !reduceMotion) {
    return (
      <motion.span
        data-slot="progress-fill"
        className={className}
        initial={false}
        animate={{ width }}
        transition={SPRING_DEFAULT}
        style={{ width }}
      >
        {band ? <ProgressBand /> : null}
      </motion.span>
    )
  }
  return (
    <span data-slot="progress-fill" className={cn(className, PLAIN_FILL_CLASS)} style={{ width }}>
      {band ? <ProgressBand /> : null}
    </span>
  )
}

function ProgressSweep({ reduceMotion }: { reduceMotion: boolean }) {
  if (reduceMotion) {
    return (
      <span
        data-slot="progress-indeterminate"
        data-reduced="true"
        className="absolute inset-0 rounded-[inherit] bg-mise/50"
      />
    )
  }
  return (
    <motion.span
      data-slot="progress-indeterminate"
      data-reduced="false"
      className="absolute inset-y-0 left-0 rounded-[inherit] bg-mise"
      style={{ width: `${SWEEP_BAR_WIDTH_PERCENT}%` }}
      initial={{ x: SWEEP_KEYFRAMES[0] }}
      animate={{ x: SWEEP_KEYFRAMES[1] }}
      transition={{ duration: SWEEP_SECONDS, ease: "easeInOut", repeat: Infinity }}
    />
  )
}

interface ProgressSegmentsProps {
  /** null means indeterminate. */
  percent: number | null
  steps: number
  spring: boolean
  shimmer: boolean
  reduceMotion: boolean
}

function SegmentFill({ filled, animated }: { filled: boolean; animated: boolean }) {
  const className = "absolute inset-0 origin-left bg-mise"
  if (animated) {
    return <motion.span className={className} initial={false} animate={{ scaleX: filled ? 1 : 0 }} transition={SPRING_DEFAULT} />
  }
  return filled ? <span className={className} /> : null
}

function SegmentPulse({ index, reduceMotion }: { index: number; reduceMotion: boolean }) {
  if (reduceMotion) {
    return <span data-slot="progress-indeterminate" data-reduced="true" className="absolute inset-0 bg-mise/50" />
  }
  return (
    <motion.span
      data-slot="progress-indeterminate"
      data-reduced="false"
      className="absolute inset-0 bg-mise"
      initial={{ opacity: 0.15 }}
      animate={{ opacity: [0.15, 1, 0.15] }}
      transition={{
        duration: SWEEP_SECONDS,
        ease: "easeInOut",
        repeat: Infinity,
        delay: index * SEGMENT_PULSE_DELAY_SECONDS,
      }}
    />
  )
}

function ProgressSegments({ percent, steps, spring, shimmer, reduceMotion }: ProgressSegmentsProps) {
  const indeterminate = percent === null
  // Floor, not round: a cell lights when its step is finished, so 99 percent never reads as done.
  const filledCount = indeterminate ? 0 : Math.floor((percent / 100) * steps)
  return (
    <>
      {Array.from({ length: steps }, (_, index) => {
        const filled = index < filledCount
        return (
          <span
            key={index}
            data-slot="progress-segment"
            data-filled={filled ? "true" : "false"}
            className="relative h-full min-w-0 flex-1 overflow-hidden rounded-[inherit] bg-input/70"
          >
            {indeterminate ? (
              <SegmentPulse index={index} reduceMotion={reduceMotion} />
            ) : (
              <SegmentFill filled={filled} animated={spring && !reduceMotion} />
            )}
            {shimmer && !reduceMotion && index === filledCount ? <ProgressBand overEmpty /> : null}
          </span>
        )
      })}
    </>
  )
}

export { ProgressFill, ProgressSweep, ProgressSegments }
