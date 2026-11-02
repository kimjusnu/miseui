import type * as React from "react"
import { motion, useReducedMotion } from "motion/react"

const DEFAULT_SWEEP_SECONDS = 2.2
/** Pause between passes. A band that never stops reads as a progress bar; one that breathes reads as thought. */
const REST_SECONDS = 0.5
/**
 * The image is three text widths wide with the bright band in its middle, so background-position
 * 100% parks the band just past the left edge and 0% just past the right. Both ends show plain text,
 * which makes the loop seamless. Repeat (the default) keeps the text painted while the band is away.
 */
const BAND_SIZE = "300% 100%"
const SWEEP_START = "100%"
const SWEEP_END = "0%"
/** Reduced motion: the band rests on the middle of the text, lit but still. */
const RESTING_POSITION = "50%"
const BAND_GRADIENT =
  "linear-gradient(90deg, var(--muted-foreground) 40%, var(--foreground) 50%, var(--muted-foreground) 60%)"

interface ShimmerTextProps extends Omit<React.ComponentProps<"span">, "children"> {
  children: string
  /** False renders the text plainly, in whatever colour it inherits. */
  active?: boolean
  /** Seconds for one pass of the band across the text. */
  duration?: number
}

function ShimmerText({
  children,
  active = true,
  duration = DEFAULT_SWEEP_SECONDS,
  className,
  style,
  ...props
}: ShimmerTextProps) {
  const reduceMotion = useReducedMotion()

  return (
    <span
      data-slot="shimmer-text"
      data-active={active ? "true" : "false"}
      className={className}
      style={style}
      {...props}
    >
      {active ? (
        <motion.span
          data-testid="shimmer-band"
          data-reduced={reduceMotion ? "true" : "false"}
          className="inline-block bg-clip-text text-transparent"
          style={{ backgroundImage: BAND_GRADIENT, backgroundSize: BAND_SIZE }}
          initial={{ backgroundPositionX: reduceMotion ? RESTING_POSITION : SWEEP_START }}
          animate={{ backgroundPositionX: reduceMotion ? RESTING_POSITION : [SWEEP_START, SWEEP_END] }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration, ease: "easeInOut", repeat: Infinity, repeatDelay: REST_SECONDS }
          }
        >
          {children}
        </motion.span>
      ) : (
        children
      )}
    </span>
  )
}

export { ShimmerText, type ShimmerTextProps }
