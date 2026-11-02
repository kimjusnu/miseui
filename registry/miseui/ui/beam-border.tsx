import type * as React from "react"
import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import { cn } from "@/registry/miseui/lib/utils"

type BeamColor = "mise" | "foreground"

const DEFAULT_LAP_SECONDS = 4
const DEFAULT_BEAM_PX = 120
const DEFAULT_BORDER_WIDTH_PX = 1
const MS_PER_SECOND = 1000
/** Thick enough to cover the ring and its bloom; the ring mask trims it to the border. */
const BEAM_THICKNESS_PX = 16
/** The bloom ring is wider than the sharp one, so the light spills past the edge once blurred. */
const BLOOM_EXTRA_WIDTH_PX = 2
const STILL_SPAN_DEGREES = 60

const COLOR_VARS: Record<BeamColor, string> = { mise: "var(--mise)", foreground: "var(--foreground)" }

/** Transparent tail to a hot head. offset-rotate keeps the gradient pointing along the path. */
const BEAM_GRADIENT =
  "linear-gradient(90deg, transparent, var(--beam-color) 70%, color-mix(in oklch, var(--beam-color) 55%, white))"
/** Reduced motion: one still highlight centred on the top edge, where a lit edge reads as "active", not "stuck". */
const STILL_GRADIENT = `conic-gradient(from ${-STILL_SPAN_DEGREES / 2}deg, transparent 0deg, var(--beam-color) ${STILL_SPAN_DEGREES / 2}deg, transparent ${STILL_SPAN_DEGREES}deg)`
/** Content box cut out of the border box leaves only the padding ring painted. */
const RING_MASK = "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)"
const RING_CLASS = "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"

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
 * A second, blurred copy of the ring gives the head its bloom. Blur sits on the outer element because
 * filters apply before masks on the same element, which would leave a hard edge.
 */
function BeamLayer({ duration, size, borderWidth, color }: BeamLayerProps) {
  const reduceMotion = Boolean(useReducedMotion())
  const beamColor = { "--beam-color": COLOR_VARS[color] } as React.CSSProperties

  return (
    <>
      <div
        aria-hidden="true"
        data-testid="beam-layer"
        data-reduced={reduceMotion ? "true" : "false"}
        className={cn(RING_CLASS, "bg-border")}
        style={{ ...beamColor, padding: borderWidth, mask: RING_MASK, maskComposite: "exclude" }}
      >
        <BeamSweep testId="beam" duration={duration} size={size} still={reduceMotion} />
      </div>
      <div
        aria-hidden="true"
        data-testid="beam-bloom"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-80 blur-[6px] [@media(prefers-reduced-transparency:reduce)]:hidden"
        style={beamColor}
      >
        <div
          className={RING_CLASS}
          style={{ padding: borderWidth + BLOOM_EXTRA_WIDTH_PX, mask: RING_MASK, maskComposite: "exclude" }}
        >
          <BeamSweep duration={duration} size={size} still={reduceMotion} />
        </div>
      </div>
    </>
  )
}

interface BeamSweepProps {
  duration: number
  size: number
  still: boolean
  testId?: string
}

/** The corner radius in px; offset-path's rect() cannot inherit it the way border-radius can. */
function useInheritedRadius(ref: React.RefObject<HTMLDivElement | null>) {
  const [radius, setRadius] = useState("0px")

  useEffect(() => {
    const parent = ref.current?.parentElement
    if (parent) setRadius(getComputedStyle(parent).borderTopLeftRadius || "0px")
  }, [ref])

  return radius
}

/**
 * Travels the perimeter on an offset path, so speed and length stay the same on every edge. A spinning
 * conic gradient cannot do that: it crawls and shrinks mid-edge and whips round the corners of a wide card.
 * The Web Animations API needs no stylesheet from the installer and runs without a React render per frame.
 */
function BeamSweep({ duration, size, still, testId }: BeamSweepProps) {
  const ref = useRef<HTMLDivElement>(null)
  const radius = useInheritedRadius(ref)

  useEffect(() => {
    const node = ref.current
    if (still || !node || typeof node.animate !== "function") return
    const animation = node.animate([{ offsetDistance: "0%" }, { offsetDistance: "100%" }], {
      duration: duration * MS_PER_SECOND,
      iterations: Infinity,
    })
    return () => animation.cancel()
  }, [duration, still])

  if (still) {
    return <div ref={ref} data-testid={testId} className="absolute inset-0" style={{ backgroundImage: STILL_GRADIENT }} />
  }

  return (
    <div
      ref={ref}
      data-testid={testId}
      className="absolute top-0 left-0"
      style={{
        width: size,
        height: BEAM_THICKNESS_PX,
        backgroundImage: BEAM_GRADIENT,
        offsetPath: `rect(0 100% 100% 0 round ${radius})`,
        offsetAnchor: "100% 50%",
        offsetRotate: "auto",
      }}
    />
  )
}

export { BeamBorder, type BeamBorderProps, type BeamColor }
