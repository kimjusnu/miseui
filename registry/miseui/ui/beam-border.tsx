import type * as React from "react"
import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import { cn } from "@/registry/miseui/lib/utils"

type BeamColor = "mise" | "foreground"

const DEFAULT_LAP_SECONDS = 4
const DEFAULT_BEAM_PX = 120
const DEFAULT_BORDER_WIDTH_PX = 1
const FULL_TURN_DEGREES = 360
/** Span used before the surface is measured (first paint, environments without ResizeObserver). */
const FALLBACK_SPAN_DEGREES = 60
/** Below this the beam reads as a dot; above it, as a second border. */
const MIN_SPAN_DEGREES = 8
const MAX_SPAN_DEGREES = 180
/** A square 1.5× the longer side covers the ring at every angle (√2 would be exact; the margin absorbs the padding). */
const COVER_FACTOR = 1.5

const COLOR_VARS: Record<BeamColor, string> = { mise: "var(--mise)", foreground: "var(--foreground)" }

/** Tail fades in, head is the sharp edge. Spun clockwise, the head leads. */
const BEAM_GRADIENT =
  "conic-gradient(from 0deg, transparent 0deg, var(--beam-color) var(--beam-span), transparent var(--beam-span))"
/** Reduced motion: one still highlight centred on the top edge, where a lit edge reads as "active", not "stuck". */
const STILL_GRADIENT =
  "conic-gradient(from calc(var(--beam-span) / -2), transparent 0deg, var(--beam-color) calc(var(--beam-span) / 2), transparent var(--beam-span))"
/** Content box cut out of the border box leaves only the padding ring painted. */
const RING_MASK = "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)"
const RING_CLASS = "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] [container-type:size]"
/** The bloom ring is a little wider than the sharp one, so the light spills past the edge once blurred. */
const BLOOM_EXTRA_WIDTH_PX = 2

interface BeamBorderProps extends React.ComponentProps<"div"> {
  /** Whether the beam is travelling. Off, the wrapper adds nothing to its children. */
  active?: boolean
  /** Seconds for one lap of the border. */
  duration?: number
  /** Beam length in px along the border. */
  size?: number
  borderWidth?: number
  color?: BeamColor
}

/** Degrees of the conic gradient that cover `beamPx` of a rectangle's perimeter. */
function spanForPerimeter(beamPx: number, width: number, height: number) {
  const perimeter = 2 * (width + height)
  if (perimeter <= 0) return FALLBACK_SPAN_DEGREES
  const span = (beamPx / perimeter) * FULL_TURN_DEGREES
  return Math.min(MAX_SPAN_DEGREES, Math.max(MIN_SPAN_DEGREES, span))
}

function useBeamSpan(ref: React.RefObject<HTMLDivElement | null>, beamPx: number) {
  const [span, setSpan] = useState(FALLBACK_SPAN_DEGREES)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (rect) setSpan(spanForPerimeter(beamPx, rect.width, rect.height))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref, beamPx])

  return span
}

function BeamBorder({
  active = true,
  duration = DEFAULT_LAP_SECONDS,
  size = DEFAULT_BEAM_PX,
  borderWidth = DEFAULT_BORDER_WIDTH_PX,
  color = "mise",
  className,
  children,
  ...props
}: BeamBorderProps) {
  return (
    <div
      data-slot="beam-border"
      data-active={active ? "true" : "false"}
      className={cn("relative rounded-[inherit]", className)}
      {...props}
    >
      {children}
      {active ? <BeamLayer duration={duration} size={size} borderWidth={borderWidth} color={color} /> : null}
    </div>
  )
}

interface BeamLayerProps {
  duration: number
  size: number
  borderWidth: number
  color: BeamColor
}

/**
 * The ring is a masked layer; inside it a square carrying the conic gradient spins with CSS, so the
 * beam keeps moving at full frame rate even while the main thread is busy streaming the answer.
 * A second, blurred copy gives the head its bloom. Blur sits on the outer element because filters
 * apply before masks on the same element, which would leave a hard edge.
 */
function BeamLayer({ duration, size, borderWidth, color }: BeamLayerProps) {
  const reduceMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const span = useBeamSpan(ref, size)
  const beamVars = {
    "--beam-duration": `${duration}s`,
    "--beam-span": `${span}deg`,
    "--beam-color": COLOR_VARS[color],
  } as React.CSSProperties
  const spin = !reduceMotion

  return (
    <>
      <div
        ref={ref}
        aria-hidden="true"
        data-testid="beam-layer"
        data-reduced={reduceMotion ? "true" : "false"}
        className={cn(RING_CLASS, "bg-border")}
        style={{ ...beamVars, padding: borderWidth, mask: RING_MASK, maskComposite: "exclude" }}
      >
        <BeamSweep testId="beam" spin={spin} />
      </div>
      <div
        aria-hidden="true"
        data-testid="beam-bloom"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-70 blur-[6px] [@media(prefers-reduced-transparency:reduce)]:hidden"
        style={beamVars}
      >
        <div
          className={RING_CLASS}
          style={{ padding: borderWidth + BLOOM_EXTRA_WIDTH_PX, mask: RING_MASK, maskComposite: "exclude" }}
        >
          <BeamSweep spin={spin} />
        </div>
      </div>
    </>
  )
}

function BeamSweep({ spin, testId }: { spin: boolean; testId?: string }) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "absolute top-1/2 left-1/2 aspect-square -translate-x-1/2 -translate-y-1/2",
        spin && "animate-spin",
      )}
      style={{
        width: `calc(max(100cqw, 100cqh) * ${COVER_FACTOR})`,
        backgroundImage: spin ? BEAM_GRADIENT : STILL_GRADIENT,
        animationDuration: "var(--beam-duration)",
      }}
    />
  )
}

export { BeamBorder, type BeamBorderProps, type BeamColor }
