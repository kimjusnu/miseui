import type * as React from "react"
import { useId, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { BeamBorder } from "@/registry/miseui/ui/beam-border"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type BadgeEffect = "glow" | "beam" | "count" | "live"

const BEAM_LENGTH_PX = 40
const BEAM_LAP_SECONDS = 3
const BREATH_TRANSITION = { duration: 2.4, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" } as const
const STILL_TRANSITION = { duration: 0 } as const
const REDUCED_FADE = { duration: 0.15 } as const
/** Far enough for the old and new glyph to overlap only near the middle of the swap, where the goo bridges them. */
const DIGIT_TRAVEL_PX = 7
const DIGIT_BLUR_PX = 2.5
/** Tuned for 12 px type: blur past a stem's width, then an alpha ramp steep enough to re-solidify it. */
const GOO_BLUR = 1
const GOO_ALPHA_SLOPE = 12
const GOO_ALPHA_OFFSET = -4.5

/** A radius on the badge has to reach the frame too, or the halo and the beam would trace another corner. */
function frameRadius(className: string | undefined) {
  return (className ?? "").split(/\s+/).filter((token) => token.startsWith("rounded"))
}

function GlowFrame({ className, children }: { className: string | undefined; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion()
  return (
    <span data-slot="badge-glow" className={cn("relative isolate inline-flex w-fit rounded-md", frameRadius(className))}>
      <motion.span
        aria-hidden="true"
        data-testid="badge-halo"
        data-reduced={reduceMotion ? "true" : "false"}
        // Transform and opacity keep the loop on the compositor; animating box-shadow would repaint every frame.
        className="absolute -inset-1 -z-10 rounded-[inherit] bg-mise blur-md [@media(prefers-reduced-transparency:reduce)]:hidden"
        initial={false}
        animate={
          reduceMotion
            ? { opacity: 0.6, transform: "scale(1)" }
            : { opacity: [0.35, 0.9], transform: ["scale(0.94)", "scale(1.1)"] }
        }
        transition={reduceMotion ? STILL_TRANSITION : BREATH_TRANSITION}
      />
      {children}
    </span>
  )
}

interface BeamFrameProps {
  variant: string | null | undefined
  className: string | undefined
  children: React.ReactNode
}

function BeamFrame({ variant, className, children }: BeamFrameProps) {
  return (
    <BeamBorder
      // A warm beam on a warm surface would vanish.
      color={variant === "mise" ? "foreground" : "mise"}
      size={BEAM_LENGTH_PX}
      duration={BEAM_LAP_SECONDS}
      className={cn("inline-flex w-fit rounded-md", frameRadius(className))}
    >
      {children}
    </BeamBorder>
  )
}

function LiveDot({ variant }: { variant: string | null | undefined }) {
  const reduceMotion = useReducedMotion()
  // On the warm and the red surface a mise dot would not read, so it takes the ink colour.
  const tone = variant === "mise" || variant === "destructive" ? "bg-current" : "bg-mise"
  return (
    <span
      aria-hidden="true"
      data-testid="badge-live-dot"
      data-reduced={reduceMotion ? "true" : "false"}
      className="relative flex size-1.5 shrink-0"
    >
      <motion.span
        className={cn("absolute inset-0 rounded-full", tone)}
        initial={false}
        animate={
          reduceMotion
            ? { opacity: 0.35, transform: "scale(1.8)" }
            : { opacity: [0.6, 0.1], transform: ["scale(1)", "scale(2.6)"] }
        }
        transition={reduceMotion ? STILL_TRANSITION : BREATH_TRANSITION}
      />
      <span className={cn("relative size-full rounded-full", tone)} />
    </span>
  )
}

interface GooeyDigitProps {
  digit: string
  filterId: string
  /** False for digits present at first paint, which must not replay an arrival. */
  enter: boolean
  reduceMotion: boolean
}

function hiddenDigit(offset: number) {
  return { opacity: 0, y: offset, filter: `blur(${DIGIT_BLUR_PX}px)` }
}

/**
 * The goo filter only runs while a swap is in flight. Blur-then-threshold rounds small type, so leaving it on
 * would soften the resting number. Each digit owns the flag, so unchanged digits stay crisp next to a moving one.
 */
function GooeyDigit({ digit, filterId, enter, reduceMotion }: GooeyDigitProps) {
  const [settled, setSettled] = useState(digit)
  const morphing = !reduceMotion && settled !== digit
  return (
    <span
      data-testid="badge-digit"
      data-morphing={morphing ? "true" : "false"}
      className="inline-grid"
      style={morphing ? { filter: `url(#${filterId})` } : undefined}
    >
      <AnimatePresence initial={enter} onExitComplete={() => setSettled(digit)}>
        <motion.span
          key={digit}
          className="col-start-1 row-start-1"
          initial={reduceMotion ? { opacity: 0 } : hiddenDigit(DIGIT_TRAVEL_PX)}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reduceMotion ? { opacity: 0 } : hiddenDigit(-DIGIT_TRAVEL_PX)}
          transition={reduceMotion ? REDUCED_FADE : SPRING_DEFAULT}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function DigitGooFilter({ id }: { id: string }) {
  return (
    <svg aria-hidden="true" className="absolute size-0">
      <defs>
        {/* The default filter region would clip a digit mid-travel. */}
        <filter id={id} x="-50%" y="-100%" width="200%" height="300%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation={GOO_BLUR} result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${GOO_ALPHA_SLOPE} ${GOO_ALPHA_OFFSET}`}
          />
        </filter>
      </defs>
    </svg>
  )
}

function GooeyCount({ value }: { value: string }) {
  const reduceMotion = useReducedMotion() ?? false
  const filterId = `badge-goo-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  const [initialLength] = useState(value.length)
  const digits = value.split("")
  return (
    <>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" data-testid="badge-count" className="inline-flex tabular-nums">
        {reduceMotion ? null : <DigitGooFilter id={filterId} />}
        {digits.map((digit, index) => {
          // Keyed from the right: units stay units when the number gains a digit.
          const position = digits.length - index - 1
          return (
            <GooeyDigit
              key={position}
              digit={digit}
              filterId={filterId}
              enter={position >= initialLength}
              reduceMotion={reduceMotion}
            />
          )
        })}
      </span>
    </>
  )
}

export { BeamFrame, GlowFrame, GooeyCount, LiveDot, type BadgeEffect }
