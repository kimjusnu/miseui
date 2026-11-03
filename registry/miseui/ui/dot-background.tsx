import type * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { BackgroundPointerLayer, useBackgroundPointer } from "@/registry/miseui/ui/grid-background-pointer"
import { cn } from "@/registry/miseui/lib/utils"

type DotBackgroundVariant = "dots" | "fade" | "plus" | "halftone"
type DotBackgroundEffect = "pointer"

interface HalftoneBucket {
  radius: number
  /** One path per dot size, zero-length segments with round caps: a few thousand dots stay one element each. */
  path: string
}

const CELL = "var(--mise-dot-cell,20px)"
const DOT_IMAGE = "radial-gradient(circle,var(--mise-dot) 1px,transparent 1.5px)"
const DOTS_STYLE: React.CSSProperties = { backgroundImage: DOT_IMAGE, backgroundSize: `${CELL} ${CELL}` }
const FADE_MASK = "radial-gradient(ellipse closest-side at 50% 50%,#000 20%,transparent 100%)"
const FADE_STYLE: React.CSSProperties = { ...DOTS_STYLE, maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }

/** A mask, because a data URI cannot read a theme token. Whole-pixel arms stay crisp at 1x. */
const PLUS_TILE = `url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><path d='M11 8h1v3h3v1h-3v3h-1v-3H8v-1h3z'/></svg>")}")`
const PLUS_STYLE: React.CSSProperties = { opacity: 0.7, backgroundColor: "var(--mise-dot)", maskImage: PLUS_TILE, WebkitMaskImage: PLUS_TILE, maskSize: "24px 24px", WebkitMaskSize: "24px 24px" }

const HALFTONE_STYLE: React.CSSProperties = { color: "var(--mise-dot)" }
const HALFTONE_CELL = 12
const HALFTONE_MAX_RADIUS = 4
const HALFTONE_MIN_RADIUS = 0.4
const HALFTONE_STEP = 0.4
const HALFTONE_CEILING = 8000
/** Dots stop before the middle of the box, where the text sits, so the pattern stays in its corner at any size. */
const HALFTONE_REACH = 0.45

/** Dot size grows toward the top right corner on a staggered grid. The cell widens on a huge box, so the count has a ceiling. */
function halftoneBuckets(width: number, height: number): readonly HalftoneBucket[] {
  if (width <= 0 || height <= 0) return []
  const cell = Math.max(HALFTONE_CELL, Math.sqrt((width * height) / HALFTONE_CEILING))
  const pitch = cell * 0.866
  const reach = Math.hypot(width, height) * HALFTONE_REACH
  const rows = Math.ceil(height / pitch) + 1
  const cols = Math.ceil(width / cell) + 1
  const segments = Array.from({ length: rows }).flatMap((_, row) =>
    Array.from({ length: cols }).flatMap((__, col) => {
      const x = col * cell + (row % 2 ? cell / 2 : 0)
      const y = row * pitch
      const closeness = 1 - Math.hypot(width - x, y) / reach
      const radius = closeness > 0 ? HALFTONE_MAX_RADIUS * closeness ** 1.6 : 0
      const stepped = Math.round(radius / HALFTONE_STEP) * HALFTONE_STEP
      return stepped < HALFTONE_MIN_RADIUS ? [] : [{ radius: Number(stepped.toFixed(1)), segment: `M${x.toFixed(1)} ${y.toFixed(1)}h0` }]
    }),
  )
  const sizes = [...new Set(segments.map((dot) => dot.radius))]
  return sizes.map((radius) => ({
    radius,
    path: segments
      .filter((dot) => dot.radius === radius)
      .map((dot) => dot.segment)
      .join(""),
  }))
}

/** Measures the layer, not the root, so the owner keeps their own ref on the root. */
function useLayerSize(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const layer = ref.current
    if (!enabled || !layer) return
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width)
      const height = Math.round(entry.contentRect.height)
      setSize((current) => (current.width === width && current.height === height ? current : { width, height }))
    })
    observer.observe(layer)
    return () => observer.disconnect()
  }, [enabled])
  return { ref, size }
}

function Halftone({ buckets }: { buckets: readonly HalftoneBucket[] }) {
  return (
    <svg data-slot="dot-background-halftone" className="absolute inset-0 size-full" style={HALFTONE_STYLE} fill="none" stroke="currentColor" strokeLinecap="round">
      {buckets.map((bucket) => (
        <path key={bucket.radius} d={bucket.path} strokeWidth={bucket.radius * 2} />
      ))}
    </svg>
  )
}

function Marks({ variant, buckets }: { variant: DotBackgroundVariant; buckets: readonly HalftoneBucket[] }) {
  if (variant === "halftone") return <Halftone buckets={buckets} />
  const style = variant === "fade" ? FADE_STYLE : variant === "plus" ? PLUS_STYLE : DOTS_STYLE
  return <div data-slot="dot-background-marks" className="absolute inset-0" style={style} />
}

type DotBackgroundProps = React.ComponentProps<"div"> & {
  /** `dots` an even field, `fade` dots dissolve toward the edges, `plus` small plus marks, `halftone` dots grow toward the top right corner. */
  variant?: DotBackgroundVariant
  /** `pointer` colours the marks around the pointer. Off on touch. */
  effect?: DotBackgroundEffect
}

/** Change the spacing of `dots` and `fade` from the outside: `className="[--mise-dot-cell:24px]"`. */
function DotBackground({ variant = "dots", effect, className, children, onPointerMove, onPointerLeave, ...props }: DotBackgroundProps) {
  const { lit, handlers } = useBackgroundPointer(effect === "pointer", { onPointerMove, onPointerLeave })
  const { ref, size } = useLayerSize(variant === "halftone")
  const buckets = useMemo(() => (variant === "halftone" ? halftoneBuckets(size.width, size.height) : []), [variant, size.width, size.height])
  return (
    <div
      {...props}
      {...handlers}
      data-slot="dot-background"
      data-variant={variant}
      data-effect={effect}
      data-lit={lit ? "true" : undefined}
      className={cn("relative isolate overflow-clip", className)}
    >
      <div
        ref={ref}
        aria-hidden="true"
        data-slot="dot-background-layer"
        className="pointer-events-none absolute inset-0 rounded-[inherit] [--mise-dot:color-mix(in_oklab,var(--foreground)_22%,transparent)] contrast-more:hidden forced-colors:hidden"
      >
        <Marks variant={variant} buckets={buckets} />
        {effect === "pointer" ? (
          <BackgroundPointerLayer lit={lit} className="[--mise-dot:var(--mise)]">
            <Marks variant={variant} buckets={buckets} />
          </BackgroundPointerLayer>
        ) : null}
      </div>
      <div data-slot="dot-background-content" className="relative h-full min-h-[inherit]">
        {children}
      </div>
    </div>
  )
}

export { DotBackground, halftoneBuckets, type DotBackgroundProps, type DotBackgroundVariant, type DotBackgroundEffect, type HalftoneBucket }
