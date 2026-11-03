import type * as React from "react"
import { useMemo, useRef } from "react"
import { LIGHT_TOKEN_CLASS, LOOP_CLASS, loopStyle, playStyle, useBackgroundPlayback } from "@/registry/miseui/ui/background-loop"
import { columnLayout, rayGradient, rayLayout, travelLayout, type Travel } from "@/registry/miseui/ui/beams-background-layout"
import { cn } from "@/registry/miseui/lib/utils"

type BeamsBackgroundVariant = "rays" | "lines" | "sweep" | "columns"
type BeamsBackgroundEffect = "flow" | "still"

const GRID_PX = 48
const TAIL_PX = 96
const SWEEP_OPACITY = 0.18

const KEYFRAMES = [
  "@keyframes mise-beam-breathe{0%,100%{opacity:calc(var(--mise-o)*.45)}50%{opacity:var(--mise-o)}}",
  `@keyframes mise-beam-x{0%{transform:translateX(-100%);opacity:0}8%,42%{opacity:var(--mise-o)}50%,100%{transform:translateX(calc(100% + ${TAIL_PX}px));opacity:0}}`,
  `@keyframes mise-beam-y{0%{transform:translateY(-100%);opacity:0}8%,42%{opacity:var(--mise-o)}50%,100%{transform:translateY(calc(100% + ${TAIL_PX}px));opacity:0}}`,
  "@keyframes mise-beam-sweep{from{transform:translateX(-80%) skewX(-16deg)}to{transform:translateX(120%) skewX(-16deg)}}",
  "@keyframes mise-beam-shaft{0%,100%{transform:translateY(var(--mise-from));opacity:calc(var(--mise-o)*.5)}50%{transform:translateY(var(--mise-to));opacity:var(--mise-o)}}",
].join("")

const RAY_MASK = "radial-gradient(ellipse 56% 94% at 50% 0%, #000 10%, transparent 100%)"
const SHAFT_MASK = "linear-gradient(90deg, transparent, #000 50%, transparent)"
const GRID_STYLE: React.CSSProperties = {
  backgroundImage: "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
  backgroundSize: `${GRID_PX}px ${GRID_PX}px`,
  maskImage: "radial-gradient(ellipse closest-side, #000 45%, transparent 100%)",
  // The lights are the subject and a grid line can cross the text, so the grid itself stays barely there.
  opacity: 0.55,
}

/** Percent would drift off the hairlines as the box resizes; round() snaps it back on to the 48 px grid. */
const AT_CLASS = {
  x: "inset-x-0 h-px top-(--mise-at) supports-[top:round(down,1%,1px)]:top-[round(down,var(--mise-at),48px)]",
  y: "inset-y-0 w-px left-(--mise-at) supports-[left:round(down,1%,1px)]:left-[round(down,var(--mise-at),48px)]",
} as const

interface FaceProps {
  seed: number
  still: boolean
}

function vars(values: Record<string, string | number>) {
  return values as React.CSSProperties
}

function RaysFace({ seed, still }: FaceProps) {
  const rays = useMemo(() => rayLayout(seed), [seed])
  return rays.map((ray) => (
    <span
      key={ray.angle}
      data-slot="beams-background-ray"
      className={cn("absolute inset-0", LOOP_CLASS)}
      style={{
        backgroundImage: rayGradient(ray),
        maskImage: RAY_MASK,
        ...vars({ "--mise-o": ray.peak }),
        ...(still ? { opacity: ray.peak * 0.8 } : loopStyle("mise-beam-breathe", ray.seconds, ray.delay, "ease-in-out")),
      }}
    />
  ))
}

function Light({ travel, still }: { travel: Travel; still: boolean }) {
  const horizontal = travel.axis === "x"
  return (
    <span
      data-slot="beams-background-light"
      data-axis={travel.axis}
      className={cn("absolute", AT_CLASS[travel.axis], LOOP_CLASS)}
      style={{
        ...vars({ "--mise-at": `${travel.at}%`, "--mise-o": travel.peak }),
        ...(still
          ? { opacity: travel.peak, transform: `translate${horizontal ? "X" : "Y"}(${travel.still}%)` }
          : loopStyle(`mise-beam-${travel.axis}`, travel.seconds, travel.delay)),
      }}
    >
      <span
        className={cn("absolute", horizontal ? "right-0 h-full w-24 bg-linear-to-r" : "bottom-0 h-24 w-full bg-linear-to-b", "from-transparent to-(--mise-light)")}
      />
    </span>
  )
}

function LinesFace({ seed, still }: FaceProps) {
  const travels = useMemo(() => travelLayout(seed), [seed])
  return (
    <>
      <span data-slot="beams-background-grid" className="absolute inset-0" style={GRID_STYLE} />
      {travels.map((travel) => (
        <Light key={`${travel.axis}${travel.at}`} travel={travel} still={still} />
      ))}
    </>
  )
}

function SweepFace({ still }: FaceProps) {
  return (
    <span
      data-slot="beams-background-band"
      className={cn("absolute inset-y-[-20%] left-0 w-[70%] bg-linear-to-r from-transparent via-(--mise-light) to-transparent", LOOP_CLASS)}
      style={{
        opacity: SWEEP_OPACITY,
        ...(still ? { transform: "translateX(45%) skewX(-16deg)" } : loopStyle("mise-beam-sweep", 16, -5, "ease-in-out", "alternate")),
      }}
    />
  )
}

function ColumnsFace({ seed, still }: FaceProps) {
  const columns = useMemo(() => columnLayout(seed), [seed])
  return columns.map((column) => (
    <span
      key={column.left}
      data-slot="beams-background-column"
      className={cn("absolute bg-linear-to-b from-transparent via-(--mise-light) to-transparent", LOOP_CLASS)}
      style={{
        left: `${column.left}%`,
        top: `${column.top}%`,
        width: `${column.width}%`,
        height: `${column.height}%`,
        maskImage: SHAFT_MASK,
        ...vars({ "--mise-o": column.peak, "--mise-from": `${column.from}%`, "--mise-to": `${column.to}%` }),
        ...(still ? { opacity: column.peak * 0.8 } : loopStyle("mise-beam-shaft", column.seconds, column.delay, "ease-in-out")),
      }}
    />
  ))
}

const FACE = { rays: RaysFace, lines: LinesFace, sweep: SweepFace, columns: ColumnsFace } as const

type BeamsBackgroundProps = Omit<React.ComponentProps<"div">, "ref"> & {
  /** `rays` a fan from above, `lines` lights on a faint grid, `sweep` one wide band crossing, `columns` soft vertical shafts. */
  variant?: BeamsBackgroundVariant
  /** `flow` moves while on screen. `still` draws one finished frame, the same one reduced motion gets. */
  effect?: BeamsBackgroundEffect
  /** Holds the motion. Wire it to a control: motion past five seconds needs a way to stop it. */
  paused?: boolean
  /** Another seed gives another layout that is still the same on the server and the client. */
  seed?: number
}

function BeamsBackground({ variant = "rays", effect = "flow", paused = false, seed = 1, className, children, ...props }: BeamsBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const { still, playing } = useBackgroundPlayback(rootRef, { paused, loops: effect === "flow" })
  const Face = FACE[variant]
  return (
    <div
      {...props}
      ref={rootRef}
      data-slot="beams-background"
      data-variant={variant}
      data-effect={effect}
      data-playing={still ? undefined : String(playing)}
      className={cn("relative isolate min-w-0 overflow-clip", className)}
    >
      {still ? null : <style href="mise-beams-background" precedence="default">{KEYFRAMES}</style>}
      <div
        aria-hidden="true"
        data-slot="beams-background-layer"
        className={cn("pointer-events-none absolute inset-0 -z-10 overflow-clip rounded-[inherit]", LIGHT_TOKEN_CLASS)}
        style={playStyle(playing)}
      >
        <Face seed={seed} still={still} />
      </div>
      <div data-slot="beams-background-content" className="relative h-full">
        {children}
      </div>
    </div>
  )
}

export { BeamsBackground, type BeamsBackgroundProps, type BeamsBackgroundVariant, type BeamsBackgroundEffect }
