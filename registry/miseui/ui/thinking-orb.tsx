import type * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type OrbState = "idle" | "listening" | "thinking" | "speaking"

const DEFAULT_SIZE_PX = 56
const FULL_TURN_DEGREES = 360

interface BodyLoop {
  scale: number[]
  seconds: number
}

/** Every loop starts and ends at 1, so switching state never lands more than one breath away. */
const BODY_LOOP: Record<OrbState, BodyLoop> = {
  idle: { scale: [1, 1.03, 1], seconds: 4 },
  listening: { scale: [1, 1.06, 1], seconds: 1.4 },
  thinking: { scale: [1, 1.02, 1], seconds: 3 },
  speaking: { scale: [1, 1.08, 1, 1.04, 1], seconds: 0.9 },
}
/** Idle sits back; every working state is fully lit. With reduced motion this tone is all that separates them. */
const IDLE_TONE = 0.7
const HALO_SECONDS = 1.4
const HALO_END_SCALE = 1.7
const HALO_START_OPACITY = 0.45
/** Reduced motion: a still halo, a little outside the body. */
const HALO_STILL_SCALE = 1.25
const SWIRL_LAP_SECONDS = 6
const SWIRL_OPACITY = 0.7

/**
 * Lit from the upper left, darkening to the rim: a sphere, not a disc. Light is mixed from white and
 * shade from black, not from theme tokens: those flip in dark mode and would light the sphere from below.
 */
const BODY_GRADIENT =
  "radial-gradient(circle at 35% 30%, color-mix(in oklch, var(--mise) 45%, white) 0%, var(--mise) 55%, color-mix(in oklch, var(--mise) 62%, black) 100%)"
const SWIRL_LIGHT = "radial-gradient(circle at 70% 68%, color-mix(in oklch, var(--mise) 20%, white) 0%, transparent 50%)"
const SWIRL_SOFT = "radial-gradient(circle at 28% 72%, color-mix(in oklch, var(--mise) 55%, white) 0%, transparent 46%)"

interface ThinkingOrbProps extends React.ComponentProps<"div"> {
  state?: OrbState
  /** Diameter in px. */
  size?: number
  /** Accessible name. Falls back to the state. */
  label?: string
}

function ThinkingOrb({
  state = "idle",
  size = DEFAULT_SIZE_PX,
  label,
  className,
  style,
  ...props
}: ThinkingOrbProps) {
  const reduceMotion = useReducedMotion()
  const loop = BODY_LOOP[state]
  const tone = state === "idle" ? IDLE_TONE : 1

  return (
    <div
      role="img"
      aria-label={label ?? state}
      data-slot="thinking-orb"
      data-state={state}
      data-reduced={reduceMotion ? "true" : "false"}
      className={cn("relative inline-block shrink-0", className)}
      style={{ ...style, width: size, height: size }}
      {...props}
    >
      <AnimatePresence>
        {state === "listening" ? (
          <motion.span
            key="halo"
            data-testid="orb-halo"
            className="absolute inset-0 rounded-full border border-mise"
            initial={{ opacity: 0, scale: 1 }}
            animate={
              reduceMotion
                ? { opacity: HALO_START_OPACITY, scale: HALO_STILL_SCALE }
                : { opacity: [HALO_START_OPACITY, 0], scale: [1, HALO_END_SCALE] }
            }
            exit={{ opacity: 0 }}
            transition={reduceMotion ? SPRING_DEFAULT : { duration: HALO_SECONDS, ease: "easeOut", repeat: Infinity }}
          />
        ) : null}
      </AnimatePresence>
      <motion.span
        data-testid="orb-body"
        className="absolute inset-0 rounded-full"
        style={{ backgroundImage: BODY_GRADIENT }}
        animate={{ scale: reduceMotion ? 1 : loop.scale, opacity: tone }}
        transition={{
          scale: reduceMotion ? { duration: 0 } : { duration: loop.seconds, ease: "easeInOut", repeat: Infinity },
          opacity: SPRING_DEFAULT,
        }}
      />
      <span aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-full blur-[1.5px]">
        <Swirl gradient={SWIRL_LIGHT} direction={1} visible={state === "thinking"} still={Boolean(reduceMotion)} />
        <Swirl gradient={SWIRL_SOFT} direction={-1} visible={state === "thinking"} still={Boolean(reduceMotion)} />
      </span>
    </div>
  )
}

interface SwirlProps {
  gradient: string
  direction: 1 | -1
  visible: boolean
  still: boolean
}

/**
 * Two off-centre pools of light turning against each other read as churn. They keep turning while
 * hidden so that showing them is a fade, never a jump to a new angle.
 */
function Swirl({ gradient, direction, visible, still }: SwirlProps) {
  return (
    <motion.span
      data-testid="orb-swirl"
      className="absolute inset-0 rounded-full"
      style={{ backgroundImage: gradient }}
      initial={{ opacity: 0, rotate: 0 }}
      animate={{ opacity: visible ? SWIRL_OPACITY : 0, rotate: still ? 0 : direction * FULL_TURN_DEGREES }}
      transition={{
        opacity: SPRING_DEFAULT,
        rotate: still ? { duration: 0 } : { duration: SWIRL_LAP_SECONDS, ease: "linear", repeat: Infinity },
      }}
    />
  )
}

export { ThinkingOrb, type ThinkingOrbProps, type OrbState }
