import type * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT, clampUnit } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

const DEFAULT_INTENSITY = 0.6
/** One slow lap: alive enough to notice, slow enough never to pull the eye off the content. */
const LAP_SECONDS = 10
/** Band width grows 1.5 px to 5 px with intensity; the haze is three bands wide and blurred. */
const MIN_BAND_PX = 1.5
const BAND_RANGE_PX = 3.5
const HAZE_BAND_FACTOR = 3
const MIN_BLUR_PX = 8
const BLUR_RANGE_PX = 24
/** The band is always clearly there; the haze is what intensity mostly buys. */
const BAND_BASE_OPACITY = 0.5
const HAZE_MAX_OPACITY = 0.7
/** A square 1.5× the longer side covers the ring at every angle (√2 would be exact). */
const COVER_FACTOR = 1.5

/** Mise and two lightness neighbours mixed from tokens, so the light stays one hue, never a rainbow. Ends where it starts. */
const GLOW_GRADIENT = [
  "conic-gradient(from 0deg, var(--mise)",
  "color-mix(in oklch, var(--mise) 70%, var(--background))",
  "var(--mise)",
  "color-mix(in oklch, var(--mise) 70%, var(--foreground))",
  "var(--mise))",
].join(", ")
/** Content box cut out of the border box leaves only the padding ring painted. */
const RING_MASK = "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)"

/** motion.div owns these; the same names on a plain div would not type-check against it. */
type DivProps = Omit<React.ComponentProps<"div">, "style" | "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart">

interface IntelligenceGlowProps extends DivProps {
  /** Shown while the assistant is listening or thinking. Fades in and out. */
  active?: boolean
  /** 0..1, how much light. Values outside the range are clamped. */
  intensity?: number
  /** False: the screen edges (fixed). True: the edges of the nearest positioned parent. */
  inset?: boolean
  style?: React.CSSProperties
}

function IntelligenceGlow({
  active = false,
  intensity = DEFAULT_INTENSITY,
  inset = false,
  className,
  style,
  ...props
}: IntelligenceGlowProps) {
  const reduceMotion = useReducedMotion()
  const level = clampUnit(intensity)
  const bandPx = MIN_BAND_PX + BAND_RANGE_PX * level
  const blurPx = MIN_BLUR_PX + BLUR_RANGE_PX * level

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          role="presentation"
          aria-hidden="true"
          data-slot="intelligence-glow"
          data-active="true"
          data-reduced={reduceMotion ? "true" : "false"}
          className={cn(
            "pointer-events-none inset-0 overflow-hidden",
            inset ? "absolute rounded-[inherit]" : "fixed z-50",
            className,
          )}
          style={{ ...style, "--glow-intensity": `${level}`, "--glow-blur": `${blurPx}px` } as React.CSSProperties}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={SPRING_DEFAULT}
          {...props}
        >
          <GlowRing
            width={bandPx * HAZE_BAND_FACTOR}
            opacity={HAZE_MAX_OPACITY * level}
            spin={!reduceMotion}
            className="blur-(--glow-blur) [@media(prefers-reduced-transparency:reduce)]:blur-none"
          />
          <GlowRing width={bandPx} opacity={BAND_BASE_OPACITY + (1 - BAND_BASE_OPACITY) * level} spin={!reduceMotion} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

interface GlowRingProps {
  width: number
  opacity: number
  spin: boolean
  className?: string
}

/**
 * Blur sits on the outer element and the mask on the inner one. Filters apply before masks on the
 * same element, so blurring the masked element itself would leave a hard-edged ring.
 */
function GlowRing({ width, opacity, spin, className }: GlowRingProps) {
  return (
    <div className={cn("absolute inset-0 rounded-[inherit]", className)} style={{ opacity }}>
      <div
        className="absolute inset-0 overflow-hidden rounded-[inherit] [container-type:size]"
        style={{ padding: width, mask: RING_MASK, maskComposite: "exclude" } as React.CSSProperties}
      >
        <div
          data-testid="glow-spin"
          className={cn("absolute top-1/2 left-1/2 aspect-square -translate-x-1/2 -translate-y-1/2", spin && "animate-spin")}
          style={{
            width: `calc(max(100cqw, 100cqh) * ${COVER_FACTOR})`,
            backgroundImage: GLOW_GRADIENT,
            animationDuration: `${LAP_SECONDS}s`,
          }}
        />
      </div>
    </div>
  )
}

export { IntelligenceGlow, type IntelligenceGlowProps }
