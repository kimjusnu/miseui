import type * as React from "react"
import { cn } from "@/registry/miseui/lib/utils"

type NoiseBackgroundVariant = "grain" | "paper" | "tint" | "speckle"

interface NoiseTile {
  /** feTurbulence baseFrequency: higher is finer. Two numbers stretch the grain along one axis. */
  frequency: string
  octaves: number
  /** Alpha out = slope * alpha in + intercept. A steep slope with a low intercept leaves only the rare peaks: flecks. */
  slope: number
  intercept: number
  size: number
  seed: number
}

interface NoiseLayer {
  tile?: NoiseTile
  /** A token colour: the tile is a mask over it, because a data URI cannot read a theme. */
  className: string
}

/** The noise goes into the alpha channel, so one image serves both themes through the colour behind the mask. stitchTiles hides the seam. */
function noiseTile({ frequency, octaves, slope, intercept, size, seed }: NoiseTile) {
  const matrix = `0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${slope} ${intercept}`
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>` +
    `<filter id='n' x='0' y='0' width='100%' height='100%'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='${frequency}' numOctaves='${octaves}' seed='${seed}' stitchTiles='stitch'/>` +
    `<feColorMatrix values='${matrix}'/>` +
    `</filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

const FINE_GRAIN: NoiseTile = { frequency: "0.8", octaves: 2, slope: 3.5, intercept: -1.25, size: 220, seed: 3 }

/**
 * Grain stays near single-pixel. A big soft cloud at this strength has only about ten colour levels to work with and draws
 * contour lines, and anything coarser than a couple of pixels reads as blotches, so paper stays fine too and differs by its stretched fibre.
 * Warm paper is a low chroma cast on the page colour, not a yellow: yellow on a dark page turns to mud.
 */
const LAYERS: Record<NoiseBackgroundVariant, readonly NoiseLayer[]> = {
  grain: [{ tile: FINE_GRAIN, className: "bg-foreground opacity-[0.05]" }],
  paper: [
    {
      className:
        "supports-[color:oklch(from_red_l_c_h)]:bg-[color:oklch(from_var(--background)_calc(l_-_0.012)_0.012_75)] dark:supports-[color:oklch(from_red_l_c_h)]:bg-[color:oklch(from_var(--background)_calc(l_+_0.012)_0.012_65)]",
    },
    {
      tile: { frequency: "0.65 0.95", octaves: 3, slope: 3, intercept: -1.1, size: 320, seed: 11 },
      className: "bg-foreground opacity-[0.06] supports-[color:oklch(from_red_l_c_h)]:bg-[color:oklch(from_var(--foreground)_l_0.05_65)]",
    },
  ],
  tint: [
    { className: "bg-[linear-gradient(160deg,var(--mise-soft),transparent_90%)]" },
    { tile: FINE_GRAIN, className: "bg-foreground opacity-[0.045]" },
  ],
  speckle: [
    { tile: { frequency: "0.14", octaves: 1, slope: 14, intercept: -10.2, size: 256, seed: 7 }, className: "bg-foreground opacity-[0.16] dark:opacity-[0.18]" },
    // A second colour is what makes flecks read as stationery. One grey alone reads as dirt.
    { tile: { frequency: "0.09", octaves: 1, slope: 14, intercept: -10.6, size: 256, seed: 21 }, className: "bg-mise opacity-50" },
  ],
}

function layerStyle(tile: NoiseTile | undefined): React.CSSProperties | undefined {
  if (!tile) return undefined
  const image = noiseTile(tile)
  const size = `${tile.size}px ${tile.size}px`
  return { maskImage: image, WebkitMaskImage: image, maskSize: size, WebkitMaskSize: size }
}

type NoiseBackgroundProps = React.ComponentProps<"div"> & {
  /** `grain` fine and even, `paper` coarse and warm, `tint` grain over a soft accent wash, `speckle` sparse larger flecks. */
  variant?: NoiseBackgroundVariant
}

/** Grain that moves is distracting, so there is no effect. */
function NoiseBackground({ variant = "grain", className, children, ...props }: NoiseBackgroundProps) {
  return (
    <div {...props} data-slot="noise-background" data-variant={variant} className={cn("relative isolate overflow-clip", className)}>
      <div aria-hidden="true" data-slot="noise-background-layer" className="pointer-events-none absolute inset-0 rounded-[inherit] contrast-more:hidden forced-colors:hidden">
        {LAYERS[variant].map((layer) => (
          <div key={layer.className} data-slot="noise-background-film" className={cn("absolute inset-0", layer.className)} style={layerStyle(layer.tile)} />
        ))}
      </div>
      <div data-slot="noise-background-content" className="relative h-full min-h-[inherit]">
        {children}
      </div>
    </div>
  )
}

export { NoiseBackground, noiseTile, type NoiseBackgroundProps, type NoiseBackgroundVariant, type NoiseTile }
