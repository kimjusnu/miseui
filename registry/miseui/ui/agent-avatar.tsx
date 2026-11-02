import type * as React from "react"
import { useMemo } from "react"
import { cn } from "@/registry/miseui/lib/utils"

const DEFAULT_SIZE_PX = 40
const VIEWBOX = 100
const CENTRE = VIEWBOX / 2
const BLOB_COUNT = 3
/** Each blob is drawn through this many points; six is organic without turning spiky. */
const BLOB_POINTS = 6
const BLOB_RADIUS_MIN = 18
const BLOB_RADIUS_RANGE = 16
/** How far a point may stray from the blob's mean radius: low is a pebble, high is a splat. */
const BLOB_WOBBLE = 0.3
/** Blob centres stay this close to the middle so no face is empty on one side. */
const BLOB_OFFSET_MAX = 22
const OPACITY_MIN = 0.55
const OPACITY_RANGE = 0.4
const DECIMALS = 1
const TWO_PI = Math.PI * 2
const UINT32_RANGE = 4294967296
/** Ink comes from tokens only; the hash picks and dims, so every avatar sits inside the theme. */
const PALETTE = ["var(--mise)", "var(--foreground)", "var(--muted-foreground)"] as const
const BACKGROUND = "var(--muted)"
const CLIP_CIRCLE = "circle(50% at 50% 50%)"

interface Point {
  x: number
  y: number
}

interface Blob {
  d: string
  fill: string
  opacity: number
}

interface AgentAvatarProps extends React.ComponentProps<"svg"> {
  /** Any stable string (agent id, name). The same seed always draws the same face. */
  seed: string
  /** Width and height in pixels. */
  size?: number
  /** Overrides the accessible name ("Agent {seed}"). */
  label?: string
}

/** xmur3: folds a string into a 32-bit state and hands out successive hashes of it. */
function xmur3(input: string) {
  let state = 1779033703 ^ input.length
  for (let index = 0; index < input.length; index += 1) {
    state = Math.imul(state ^ input.charCodeAt(index), 3432918353)
    state = (state << 13) | (state >>> 19)
  }
  return () => {
    state = Math.imul(state ^ (state >>> 16), 2246822507)
    state = Math.imul(state ^ (state >>> 13), 3266489909)
    state ^= state >>> 16
    return state >>> 0
  }
}

/** Uniform 0..1 from the hash stream. */
function unit(next: () => number) {
  return next() / UINT32_RANGE
}

/** Signed -1..1 from the hash stream. */
function signed(next: () => number) {
  return unit(next) * 2 - 1
}

function format(point: Point) {
  return `${point.x.toFixed(DECIMALS)} ${point.y.toFixed(DECIMALS)}`
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/** Quadratic curves through the midpoints: every point is a control, so the outline is always smooth and closed. */
function smoothClosedPath(points: readonly Point[]) {
  const last = points[points.length - 1]
  const segments = points.map((point, index) => `Q ${format(point)} ${format(midpoint(point, points[(index + 1) % points.length]))}`)
  return `M ${format(midpoint(last, points[0]))} ${segments.join(" ")} Z`
}

function makeBlob(next: () => number, index: number): Blob {
  const cx = CENTRE + signed(next) * BLOB_OFFSET_MAX
  const cy = CENTRE + signed(next) * BLOB_OFFSET_MAX
  const radius = BLOB_RADIUS_MIN + unit(next) * BLOB_RADIUS_RANGE
  const rotation = unit(next) * TWO_PI
  const points = Array.from({ length: BLOB_POINTS }, (_, step): Point => {
    const angle = rotation + (step / BLOB_POINTS) * TWO_PI
    const reach = radius * (1 + signed(next) * BLOB_WOBBLE)
    return { x: cx + Math.cos(angle) * reach, y: cy + Math.sin(angle) * reach }
  })
  const fill = PALETTE[(next() + index) % PALETTE.length]
  const opacity = Number((OPACITY_MIN + unit(next) * OPACITY_RANGE).toFixed(2))
  return { d: smoothClosedPath(points), fill, opacity }
}

function blobsFor(seed: string): readonly Blob[] {
  const next = xmur3(seed)
  return Array.from({ length: BLOB_COUNT }, (_, index) => makeBlob(next, index))
}

function AgentAvatar({ seed, size = DEFAULT_SIZE_PX, label, className, style, ...props }: AgentAvatarProps) {
  const blobs = useMemo(() => blobsFor(seed), [seed])

  return (
    <svg
      role="img"
      aria-label={label ?? `Agent ${seed}`}
      data-slot="agent-avatar"
      data-seed={seed}
      width={size}
      height={size}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      className={cn("shrink-0 overflow-hidden rounded-full", className)}
      style={{ ...style, clipPath: CLIP_CIRCLE }}
      {...props}
    >
      <circle cx={CENTRE} cy={CENTRE} r={CENTRE} fill={BACKGROUND} />
      {blobs.map((blob, index) => (
        <path key={index} d={blob.d} fill={blob.fill} fillOpacity={blob.opacity} />
      ))}
    </svg>
  )
}

export { AgentAvatar, type AgentAvatarProps }
