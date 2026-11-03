import type * as React from "react"
import { driftStyle, useDrift } from "@/registry/miseui/ui/mesh-background-drift"
import { cn } from "@/registry/miseui/lib/utils"

type MeshBackgroundVariant = "soft" | "vivid" | "corner" | "split"
type MeshBackgroundEffect = "drift"
type MeshTone = 1 | 2 | 3

interface MeshBlob {
  /** Box in percent of the background: left, top, width, height. */
  box: readonly [number, number, number, number]
  tone: MeshTone
  opacity: number
}

/** Lives with the component so an install needs no global CSS. Distances are percent of each blob, so a big box drifts further at the same pace. */
const KEYFRAMES =
  "@keyframes mise-mesh-a{to{transform:translate(10%,6%)}}@keyframes mise-mesh-b{to{transform:translate(-8%,8%)}}@keyframes mise-mesh-c{to{transform:translate(6%,-10%)}}"
const DRIFTS = [
  { name: "mise-mesh-a", seconds: 38 },
  { name: "mise-mesh-b", seconds: 52 },
  { name: "mise-mesh-c", seconds: 67 },
] as const

/**
 * Neighbours walk away from hue 100, where a darkened yellow turns to mud; the sine picks the direction per accent.
 * Lightness is clamped per theme: a near-black accent becomes silver on white, a near-white one becomes fog on black, both grey
 * by design because that palette has no chroma to spend. An older browser falls back to the plain accent in all three.
 * Written out in full: Tailwind reads classes from the source text, so a class built from a template string is never generated.
 */
const TONES_CLASS =
  "[--mise-mesh-1:var(--mise)] [--mise-mesh-2:var(--mise)] [--mise-mesh-3:var(--mise)] supports-[color:oklch(from_red_l_c_h)]:[--mise-mesh-1:oklch(from_var(--mise)_clamp(0.62,l,0.78)_c_h)] supports-[color:oklch(from_red_l_c_h)]:[--mise-mesh-2:oklch(from_var(--mise)_clamp(0.62,l,0.78)_c_calc(h_+_40_*_sin((h_-_100)_*_1deg)))] supports-[color:oklch(from_red_l_c_h)]:[--mise-mesh-3:oklch(from_var(--mise)_clamp(0.62,l,0.78)_c_calc(h_+_80_*_sin((h_-_100)_*_1deg)))] dark:supports-[color:oklch(from_red_l_c_h)]:[--mise-mesh-1:oklch(from_var(--mise)_clamp(0.5,l,0.66)_c_h)] dark:supports-[color:oklch(from_red_l_c_h)]:[--mise-mesh-2:oklch(from_var(--mise)_clamp(0.5,l,0.66)_c_calc(h_+_40_*_sin((h_-_100)_*_1deg)))] dark:supports-[color:oklch(from_red_l_c_h)]:[--mise-mesh-3:oklch(from_var(--mise)_clamp(0.5,l,0.66)_c_calc(h_+_80_*_sin((h_-_100)_*_1deg)))]"

/** Radial gradients that fade to nothing at their own box. They look blurred without a filter, so moving them costs one transform each. */
const MESH_BLOBS: Record<Exclude<MeshBackgroundVariant, "split">, readonly MeshBlob[]> = {
  soft: [
    { box: [-20, -40, 80, 110], tone: 1, opacity: 0.14 },
    { box: [45, -50, 80, 100], tone: 2, opacity: 0.12 },
    { box: [20, 40, 90, 100], tone: 3, opacity: 0.1 },
  ],
  vivid: [
    { box: [-25, -35, 85, 120], tone: 1, opacity: 0.42 },
    { box: [40, -45, 85, 115], tone: 2, opacity: 0.4 },
    { box: [-15, 35, 80, 110], tone: 3, opacity: 0.32 },
    { box: [50, 30, 75, 110], tone: 1, opacity: 0.3 },
  ],
  corner: [
    { box: [40, -60, 90, 130], tone: 1, opacity: 0.34 },
    { box: [65, -45, 55, 85], tone: 2, opacity: 0.32 },
  ],
}

/** Larger than the box, so the drift never uncovers its edge. */
const SPLIT_STYLE: React.CSSProperties = {
  inset: "-20%",
  backgroundImage: "linear-gradient(115deg in oklab,var(--mise-mesh-1) 25%,var(--mise-mesh-3) 75%)",
  opacity: 0.26,
}

const blobStyle = ({ box: [left, top, width, height], tone, opacity }: MeshBlob): React.CSSProperties => ({
  left: `${left}%`,
  top: `${top}%`,
  width: `${width}%`,
  height: `${height}%`,
  backgroundImage: `radial-gradient(closest-side,var(--mise-mesh-${tone}),transparent)`,
  opacity,
})

type MeshBackgroundProps = React.ComponentProps<"div"> & {
  /** `soft` barely tinted, `vivid` for a hero with a solid button on top, `corner` colour from one corner, `split` two colours meeting at a soft diagonal. */
  variant?: MeshBackgroundVariant
  /** `drift` moves the colours very slowly. It stops off screen and in a hidden tab. */
  effect?: MeshBackgroundEffect
  /** Holds the drift. Tie it to a pause control: motion past five seconds needs a way to stop it. */
  paused?: boolean
}

function MeshBackground({ variant = "soft", effect, paused = false, className, children, ...props }: MeshBackgroundProps) {
  const { ref, moving, playing } = useDrift(effect === "drift", paused)
  const motionFor = (index: number) => {
    const drift = DRIFTS[index % DRIFTS.length]
    return moving ? driftStyle(drift.name, drift.seconds, playing) : undefined
  }
  return (
    <div
      {...props}
      data-slot="mesh-background"
      data-variant={variant}
      data-effect={effect}
      data-playing={moving ? (playing ? "true" : "false") : undefined}
      className={cn("relative isolate overflow-clip", className)}
    >
      {moving ? <style href="mise-mesh-background" precedence="default">{KEYFRAMES}</style> : null}
      <div ref={ref} aria-hidden="true" data-slot="mesh-background-layer" className={cn("pointer-events-none absolute inset-0 rounded-[inherit] contrast-more:hidden forced-colors:hidden dark:opacity-70", TONES_CLASS)}>
        {variant === "split" ? (
          <div data-slot="mesh-background-split" className="absolute" style={{ ...SPLIT_STYLE, ...motionFor(0) }} />
        ) : (
          MESH_BLOBS[variant].map((blob, index) => <div key={blob.box.join()} data-slot="mesh-background-blob" className="absolute" style={{ ...blobStyle(blob), ...motionFor(index) }} />)
        )}
      </div>
      <div data-slot="mesh-background-content" className="relative h-full min-h-[inherit]">
        {children}
      </div>
    </div>
  )
}

export { MeshBackground, MESH_BLOBS, type MeshBackgroundProps, type MeshBackgroundVariant, type MeshBackgroundEffect, type MeshBlob }
