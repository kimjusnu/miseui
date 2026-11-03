import type * as React from "react"
import { driftStyle, useDrift } from "@/registry/miseui/ui/mesh-background-drift"
import { cn } from "@/registry/miseui/lib/utils"

type AuroraBackgroundVariant = "curtain" | "horizon" | "halo" | "ribbon"
type AuroraBackgroundEffect = "drift"
type AuroraTone = 1 | 2 | 3

interface AuroraBand {
  /** Percent of the background. */
  left: number
  width: number
  height: number
  tone: AuroraTone
  opacity: number
}

/** Lives with the component. Curtains sway and stretch along their own height, the halo turns, the ribbon slides along its length. */
const KEYFRAMES =
  "@keyframes mise-aurora-sway-a{from{transform:translateX(-8%) scaleY(.94)}to{transform:translateX(8%) scaleY(1.05)}}" +
  "@keyframes mise-aurora-sway-b{from{transform:translateX(7%) scaleY(1.05)}to{transform:translateX(-7%) scaleY(.95)}}" +
  "@keyframes mise-aurora-turn{to{transform:rotate(360deg)}}" +
  "@keyframes mise-aurora-slide{from{transform:translateX(-6%)}to{transform:translateX(6%)}}"

/** Same reasoning as mesh: hue walks away from 100, lightness clamped per theme so a near-black accent becomes silver and a near-white one fog. */
const TONES_CLASS =
  "[--mise-aurora-1:var(--mise)] [--mise-aurora-2:var(--mise)] [--mise-aurora-3:var(--mise)] supports-[color:oklch(from_red_l_c_h)]:[--mise-aurora-1:oklch(from_var(--mise)_clamp(0.62,l,0.78)_c_h)] supports-[color:oklch(from_red_l_c_h)]:[--mise-aurora-2:oklch(from_var(--mise)_clamp(0.62,l,0.78)_c_calc(h_+_40_*_sin((h_-_100)_*_1deg)))] supports-[color:oklch(from_red_l_c_h)]:[--mise-aurora-3:oklch(from_var(--mise)_clamp(0.62,l,0.78)_c_calc(h_+_80_*_sin((h_-_100)_*_1deg)))] dark:supports-[color:oklch(from_red_l_c_h)]:[--mise-aurora-1:oklch(from_var(--mise)_clamp(0.5,l,0.68)_c_h)] dark:supports-[color:oklch(from_red_l_c_h)]:[--mise-aurora-2:oklch(from_var(--mise)_clamp(0.5,l,0.68)_c_calc(h_+_40_*_sin((h_-_100)_*_1deg)))] dark:supports-[color:oklch(from_red_l_c_h)]:[--mise-aurora-3:oklch(from_var(--mise)_clamp(0.5,l,0.68)_c_calc(h_+_80_*_sin((h_-_100)_*_1deg)))]"

/**
 * Ellipses hanging from the top edge: this height and direction is what separates aurora from mesh. No filter, so swaying costs one transform each.
 * They overlap into one sheet of light. Narrow separate ones read as icicles.
 */
const CURTAINS: readonly AuroraBand[] = [
  { left: -8, width: 42, height: 78, tone: 1, opacity: 0.3 },
  { left: 12, width: 34, height: 100, tone: 2, opacity: 0.28 },
  { left: 34, width: 38, height: 70, tone: 1, opacity: 0.24 },
  { left: 54, width: 30, height: 92, tone: 3, opacity: 0.28 },
  { left: 70, width: 40, height: 100, tone: 2, opacity: 0.26 },
]

/** The same ellipses from the bottom edge, nested wide to narrow like light behind a hill. */
const HORIZONS: readonly AuroraBand[] = [
  { left: -20, width: 140, height: 78, tone: 1, opacity: 0.36 },
  { left: 12, width: 76, height: 50, tone: 2, opacity: 0.4 },
  { left: 34, width: 32, height: 28, tone: 3, opacity: 0.4 },
]

const HALO_MASK = "radial-gradient(closest-side,transparent 44%,#000 72%,transparent 100%)"
const HALO_STYLE: React.CSSProperties = {
  inset: 0,
  borderRadius: "50%",
  backgroundImage: "conic-gradient(from 20deg in oklab,var(--mise-aurora-1),var(--mise-aurora-2),var(--mise-aurora-3),var(--mise-aurora-2),var(--mise-aurora-1))",
  maskImage: HALO_MASK,
  WebkitMaskImage: HALO_MASK,
}
const RIBBON_MASK = "linear-gradient(to bottom,transparent,#000 50%,transparent)"
const RIBBON_STYLE: React.CSSProperties = {
  inset: 0,
  backgroundImage: "linear-gradient(90deg in oklab,var(--mise-aurora-1),var(--mise-aurora-2) 50%,var(--mise-aurora-3))",
  maskImage: RIBBON_MASK,
  WebkitMaskImage: RIBBON_MASK,
}

type MotionFor = (name: string, seconds: number, steady?: boolean) => React.CSSProperties | undefined

function Bands({ bands, edge, motionFor }: { bands: readonly AuroraBand[]; edge: "top" | "bottom"; motionFor: MotionFor }) {
  const anchor = edge === "top" ? "0%" : "100%"
  return bands.map((band, index) => (
    <div
      key={`${band.left}-${band.width}`}
      data-slot="aurora-background-band"
      className="absolute"
      style={{
        left: `${band.left}%`,
        width: `${band.width}%`,
        height: `${band.height}%`,
        top: edge === "top" ? 0 : undefined,
        bottom: edge === "bottom" ? 0 : undefined,
        backgroundImage: `radial-gradient(50% 100% at 50% ${anchor},var(--mise-aurora-${band.tone}),transparent)`,
        opacity: band.opacity,
        transformOrigin: `50% ${anchor}`,
        ...motionFor(index % 2 ? "mise-aurora-sway-b" : "mise-aurora-sway-a", 26 + index * 7),
      }}
    />
  ))
}

function Drawing({ variant, motionFor }: { variant: AuroraBackgroundVariant; motionFor: MotionFor }) {
  if (variant === "curtain") {
    return (
      // Leaning wider than the box, so the slant never shows a bare top corner.
      <div className="absolute inset-y-0 -inset-x-[8%] -skew-x-6">
        <Bands bands={CURTAINS} edge="top" motionFor={motionFor} />
      </div>
    )
  }
  if (variant === "horizon") return <Bands bands={HORIZONS} edge="bottom" motionFor={motionFor} />
  if (variant === "halo") {
    return (
      // Sized from the shorter side, and the ring ends inside its own box, so it always fades before the edge.
      <div className="absolute inset-0 [container-type:size]">
        <div className="absolute top-1/2 left-1/2 size-[96cqmin] -translate-x-1/2 -translate-y-1/2 opacity-35">
          <div data-slot="aurora-background-halo" className="absolute" style={{ ...HALO_STYLE, ...motionFor("mise-aurora-turn", 90, true) }} />
        </div>
      </div>
    )
  }
  return (
    // Longer than any box at this angle, so its ends are never seen.
    <div className="absolute top-1/2 -left-[40%] h-[46%] w-[180%] -translate-y-1/2 -rotate-[16deg] opacity-40">
      <div data-slot="aurora-background-ribbon" className="absolute" style={{ ...RIBBON_STYLE, ...motionFor("mise-aurora-slide", 34) }} />
    </div>
  )
}

type AuroraBackgroundProps = React.ComponentProps<"div"> & {
  /** `curtain` vertical bands from the top, `horizon` glow rising from the bottom edge, `halo` a soft ring behind the centre, `ribbon` one long diagonal band. */
  variant?: AuroraBackgroundVariant
  /** `drift` sways the light very slowly. It stops off screen and in a hidden tab. */
  effect?: AuroraBackgroundEffect
  /** Holds the drift. Tie it to a pause control: motion past five seconds needs a way to stop it. */
  paused?: boolean
}

function AuroraBackground({ variant = "curtain", effect, paused = false, className, children, ...props }: AuroraBackgroundProps) {
  const { ref, moving, playing } = useDrift(effect === "drift", paused)
  const motionFor: MotionFor = (name, seconds, steady) => (moving ? driftStyle(name, seconds, playing, steady) : undefined)
  return (
    <div
      {...props}
      data-slot="aurora-background"
      data-variant={variant}
      data-effect={effect}
      data-playing={moving ? (playing ? "true" : "false") : undefined}
      className={cn("relative isolate overflow-clip", className)}
    >
      {moving ? <style href="mise-aurora-background" precedence="default">{KEYFRAMES}</style> : null}
      <div ref={ref} aria-hidden="true" data-slot="aurora-background-layer" className={cn("pointer-events-none absolute inset-0 rounded-[inherit] contrast-more:hidden forced-colors:hidden", TONES_CLASS)}>
        <Drawing variant={variant} motionFor={motionFor} />
      </div>
      <div data-slot="aurora-background-content" className="relative h-full min-h-[inherit]">
        {children}
      </div>
    </div>
  )
}

export { AuroraBackground, type AuroraBackgroundProps, type AuroraBackgroundVariant, type AuroraBackgroundEffect }
