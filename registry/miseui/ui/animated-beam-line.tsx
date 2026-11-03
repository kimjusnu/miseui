import type * as React from "react"
import { useEffect, useState } from "react"
import { useReducedMotion } from "motion/react"
import { LIGHT_TOKEN_CLASS, LOOP_CLASS, loopStyle, playStyle, useBackgroundPlayback } from "@/registry/miseui/ui/background-loop"
import { beamPath, boxWithin, type BeamVariant } from "@/registry/miseui/ui/animated-beam-math"
import { cn } from "@/registry/miseui/lib/utils"

type AnimatedBeamEffect = "pulse"
type BeamRef = React.RefObject<HTMLElement | null>

/**
 * Dashes on the path itself, not an element sliding along it. A rigid light cannot bend: at a corner its tail sticks out
 * past the line. This repaints the path's box each frame instead of moving a layer, and it is the one place the kit
 * animates something other than transform and opacity. The dash starts and ends just off the path, because a dash of
 * zero length on the very end still draws its round cap. Offsets carry px because some browsers refuse a bare number in
 * this property; with pathLength 1 a px is the whole path.
 */
const KEYFRAMES = [
  "@keyframes mise-beam-run{0%{stroke-dashoffset:var(--mise-dash-from)}70%,100%{stroke-dashoffset:-1.02px}}",
  "@keyframes mise-beam-once{0%{stroke-dashoffset:var(--mise-dash-from)}100%{stroke-dashoffset:-1.02px}}",
  "@keyframes mise-beam-flash{0%{opacity:0}25%{opacity:1}100%{opacity:0}}",
].join("")
const TRAVEL_EASE = "cubic-bezier(0.45, 0, 0.55, 1)"
const MAX_PULSES = 3
/** Three lengths with one head give a tail that fades along the curve, where a gradient along a stroke does not exist in SVG. */
const LIGHT_PARTS = [
  { dash: 0.24, opacity: 0.3 },
  { dash: 0.13, opacity: 0.55 },
  { dash: 0.05, opacity: 1 },
] as const

interface BeamLightProps {
  path: string
  animation: () => React.CSSProperties
  className?: string
  onDone?: () => void
}

function BeamLight({ path, animation, className, onDone }: BeamLightProps) {
  return (
    <g data-slot="animated-beam-light" onAnimationEnd={onDone}>
      {LIGHT_PARTS.map(({ dash, opacity }) => (
        <path
          key={dash}
          d={path}
          pathLength={1}
          fill="none"
          stroke="var(--mise-light)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeOpacity={opacity}
          strokeDasharray={`${dash} 3`}
          strokeDashoffset={dash + 0.02}
          className={className}
          style={{ "--mise-dash-from": `${dash + 0.02}px`, ...animation() } as React.CSSProperties}
        />
      ))}
    </g>
  )
}

/**
 * Passive, not layout: a parent's ref attaches after its children's layout effects run, so a beam placed first inside
 * its container would find nothing there. It draws nothing until measured, and nothing around it depends on it.
 */
function useBeamPath(containerRef: BeamRef, fromRef: BeamRef, toRef: BeamRef, variant: BeamVariant, curvature: number, reverse: boolean) {
  const [path, setPath] = useState<string | null>(null)
  useEffect(() => {
    const container = containerRef.current
    const from = fromRef.current
    const to = toRef.current
    if (!container || !from || !to) return
    let live = true
    const measure = () => {
      if (!live) return
      const frame = container.getBoundingClientRect()
      const box = (element: HTMLElement) => boxWithin(element.getBoundingClientRect(), frame, container.clientLeft, container.clientTop)
      setPath(beamPath(box(from), box(to), variant, curvature, reverse))
    }
    const resize = new ResizeObserver(measure)
    // Parents too: a sibling growing moves an end without resizing the end or a fixed-height container.
    for (const element of new Set([container, from, to, from.parentElement, to.parentElement])) {
      if (element) resize.observe(element)
    }
    const changes = new MutationObserver(measure)
    changes.observe(container, { childList: true, subtree: true })
    void document.fonts?.ready.then(measure)
    return () => {
      live = false
      resize.disconnect()
      changes.disconnect()
    }
  }, [containerRef, fromRef, toRef, variant, curvature, reverse])
  return path
}

/** Render-phase update: one light per real change of the prop, and none for the value it mounted with. */
function usePulses(trigger: unknown, enabled: boolean) {
  const [seen, setSeen] = useState(trigger)
  const [nextId, setNextId] = useState(0)
  const [pulses, setPulses] = useState<readonly number[]>([])
  if (trigger !== seen) {
    setSeen(trigger)
    if (enabled) {
      setNextId(nextId + 1)
      setPulses([...pulses.slice(1 - MAX_PULSES), nextId])
    }
  }
  const finish = (id: number) => setPulses((current) => current.filter((pulse) => pulse !== id))
  return { pulses, finish }
}

type AnimatedBeamProps = Omit<React.ComponentProps<"div">, "ref" | "children"> & {
  /** Holds the beam and both ends. Needs `relative isolate`, so the beam can sit behind what is inside it. */
  containerRef: BeamRef
  fromRef: BeamRef
  toRef: BeamRef
  /** `line` straight, `curve` bowed by `curvature`, `step` right angles with rounded corners, `hub` leaves and arrives square, as AnimatedBeamHub draws. */
  variant?: BeamVariant
  /** `pulse` sends one light per change of `trigger` instead of a loop, for something that really happened. */
  effect?: AnimatedBeamEffect
  /** Pixels the `curve` bows. Negative bows the other way. */
  curvature?: number
  reverse?: boolean
  /** Seconds of one cycle. */
  duration?: number
  /** Seconds before it starts, to offset several beams from each other. */
  delay?: number
  /** Holds the loop. Wire it to a control: motion past five seconds needs a way to stop it. */
  paused?: boolean
  /** With `pulse`, any new value sends one light. */
  trigger?: unknown
}

function AnimatedBeam({ containerRef, fromRef, toRef, variant = "line", effect, curvature = 40, reverse = false, duration = 3.2, delay = 0, paused = false, trigger, className, style, ...props }: AnimatedBeamProps) {
  const pulsing = effect === "pulse"
  const path = useBeamPath(containerRef, fromRef, toRef, variant, curvature, reverse)
  const { still, playing } = useBackgroundPlayback(containerRef, { paused, loops: !pulsing })
  const { pulses, finish } = usePulses(trigger, pulsing)
  const reducedMotion = useReducedMotion() ?? false
  return (
    <div
      {...props}
      aria-hidden="true"
      data-slot="animated-beam"
      data-variant={variant}
      data-effect={effect}
      data-playing={still ? undefined : String(playing)}
      className={cn("pointer-events-none absolute inset-0 -z-10", LIGHT_TOKEN_CLASS, className)}
      style={{ ...playStyle(playing), ...style }}
    >
      <style href="mise-animated-beam" precedence="default">{KEYFRAMES}</style>
      {path ? (
        <svg data-slot="animated-beam-svg" className="absolute inset-0 size-full overflow-visible">
          <path data-slot="animated-beam-base" d={path} fill="none" stroke="var(--border)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          {!still && !pulsing ? <BeamLight path={path} className={LOOP_CLASS} animation={() => loopStyle("mise-beam-run", duration, delay, TRAVEL_EASE)} /> : null}
          {pulses.map((id) =>
            reducedMotion ? (
              // Nothing moves, and the line still answers: a fade says something happened without travelling anywhere.
              <path
                key={id}
                data-slot="animated-beam-flash"
                d={path}
                fill="none"
                stroke="var(--mise-light)"
                strokeWidth={1.5}
                strokeLinecap="round"
                style={{ animation: "mise-beam-flash 900ms var(--ease-mise) both" }}
                onAnimationEnd={() => finish(id)}
              />
            ) : (
              <BeamLight key={id} path={path} animation={() => ({ animation: `mise-beam-once ${duration * 0.7}s ${TRAVEL_EASE} both` })} onDone={() => finish(id)} />
            ),
          )}
        </svg>
      ) : null}
    </div>
  )
}

export { AnimatedBeam, type AnimatedBeamProps, type AnimatedBeamEffect, type BeamVariant as AnimatedBeamVariant }
