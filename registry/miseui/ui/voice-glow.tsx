import type * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT, clampUnit } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

const DEFAULT_SIZE_PX = 120
const LABEL_LISTENING = "Listening"
const LABEL_OFF = "Microphone off"
/** The solid core takes a third of the box; the halo needs the rest to breathe into. */
const CORE_SHARE = 0.34
/** Off: small and dim. On: grows a third from a whisper to a shout; the halo does most of the moving. */
const CORE_OFF_SCALE = 0.72
const CORE_OFF_OPACITY = 0.45
const CORE_BASE_SCALE = 0.85
const CORE_SCALE_RANGE = 0.3
/** The wide halo lags the voice slightly, so loud moments leave a trace instead of flickering. */
const HALO_LAG_SECONDS = 0.55
/**
 * Two halo layers: a ring that hugs the core and follows the voice, and a wide haze behind it.
 * Both are the one accent colour; only scale and opacity change with the level.
 */
const HALOS = [
  {
    gradient: "radial-gradient(circle, transparent 42%, var(--mise) 56%, transparent 72%)",
    blurPx: 10,
    baseScale: 0.62,
    scaleRange: 0.38,
    baseOpacity: 0.35,
    opacityRange: 0.5,
    lag: false,
  },
  {
    gradient: "radial-gradient(circle, var(--mise) 0%, transparent 70%)",
    blurPx: 22,
    baseScale: 0.7,
    scaleRange: 0.3,
    baseOpacity: 0.12,
    opacityRange: 0.4,
    lag: true,
  },
] as const

interface VoiceGlowProps extends React.ComponentProps<"div"> {
  /** Current input level, 0..1. Values outside the range are clamped. */
  level?: number
  /** Whether the microphone is listening. When false only a small, dim core remains. */
  active?: boolean
  /** Box size in pixels; the glow is always a circle. */
  size?: number
  /** Overrides the accessible name ("Listening" / "Microphone off"). */
  label?: string
}

function VoiceGlow({
  level = 0,
  active = false,
  size = DEFAULT_SIZE_PX,
  label,
  className,
  style,
  ...props
}: VoiceGlowProps) {
  const reduceMotion = useReducedMotion() ?? false
  const clampedLevel = clampUnit(level)
  const drive = active ? clampedLevel : 0
  const transitionFor = (lag: boolean) => {
    if (reduceMotion) return { duration: 0 }
    return lag ? { ...SPRING_DEFAULT, duration: HALO_LAG_SECONDS } : SPRING_DEFAULT
  }

  return (
    <div
      role="img"
      aria-label={label ?? (active ? LABEL_LISTENING : LABEL_OFF)}
      data-slot="voice-glow"
      data-active={active ? "true" : "false"}
      data-level={clampedLevel}
      data-reduced={reduceMotion ? "true" : "false"}
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ ...style, width: size, height: size }}
      {...props}
    >
      {HALOS.map((halo, index) => (
        <motion.span
          key={index}
          aria-hidden="true"
          data-testid="voice-glow-halo"
          className="pointer-events-none absolute inset-0 rounded-full [@media(prefers-reduced-transparency:reduce)]:blur-none"
          style={{ backgroundImage: halo.gradient, filter: `blur(${halo.blurPx}px)` }}
          initial={false}
          animate={{
            scale: halo.baseScale + halo.scaleRange * drive,
            opacity: active ? halo.baseOpacity + halo.opacityRange * drive : 0,
          }}
          transition={transitionFor(halo.lag)}
        />
      ))}
      <motion.span
        aria-hidden="true"
        data-testid="voice-glow-core"
        className="rounded-full bg-mise"
        style={{ width: size * CORE_SHARE, height: size * CORE_SHARE }}
        initial={false}
        animate={{
          scale: active ? CORE_BASE_SCALE + CORE_SCALE_RANGE * drive : CORE_OFF_SCALE,
          opacity: active ? 1 : CORE_OFF_OPACITY,
        }}
        transition={transitionFor(false)}
      />
    </div>
  )
}

export { VoiceGlow, type VoiceGlowProps }
