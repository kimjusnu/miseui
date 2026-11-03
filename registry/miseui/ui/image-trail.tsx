import type * as React from "react"
import { useCallback, useEffect, useRef } from "react"
import { useReducedMotion } from "motion/react"
import { createTrailEngine, type TrailEngine } from "@/registry/miseui/ui/image-trail-engine"
import { POOL_SIZE, STILL_LAYOUT, type ImageTrailVariant } from "@/registry/miseui/ui/image-trail-math"
import { isFinePointer } from "@/registry/miseui/ui/pointer-fine"
import { cn } from "@/registry/miseui/lib/utils"

type ImageTrailEffect = "speed"

/** The shape does half the work of telling the variants apart: portrait tiles, squares with a paper edge, tall cards, wide frames. */
const NODE_CLASS: Record<ImageTrailVariant, string> = {
  trail: "aspect-[4/5] rounded-md shadow-md",
  pile: "aspect-square rounded-sm shadow-lg ring-4 ring-background",
  fan: "aspect-[3/4] origin-bottom rounded-lg shadow-lg",
  strip: "aspect-[8/5] rounded-sm ring-1 ring-foreground/10",
}

type ImageTrailProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** What appears along the path: any nodes. They are decoration, hidden from assistive tech and from focus. */
  items: readonly React.ReactNode[]
  /** `trail` pop in and fade in order, `pile` stay stacked until the pointer rests, `fan` fall at seeded angles, `strip` upright frames sliding along the path. */
  variant?: ImageTrailVariant
  /** `speed` makes pictures larger the faster the pointer moves. */
  effect?: ImageTrailEffect
  /** Distance between pictures, in px. */
  spacing?: number
  /** Width of a picture, in px. */
  size?: number
  /** Words over the pictures. They stay on top, readable and selectable. */
  children?: React.ReactNode
}

interface TrailPartProps {
  items: readonly React.ReactNode[]
  variant: ImageTrailVariant
  size: number
}

/** The rest state, on every device. It is the whole effect on touch and under reduced motion, where the box must not be blank. */
function TrailStill({ items, variant, size }: TrailPartProps) {
  return (
    <div aria-hidden="true" inert data-slot="image-trail-still" className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-(--duration-slow) ease-(--ease-mise) select-none group-data-[active=true]/trail:opacity-0 motion-reduce:transition-none">
      {STILL_LAYOUT[variant].slice(0, items.length).map((place, index) => (
        <div
          key={index}
          data-slot="image-trail-still-item"
          className={cn("absolute -translate-x-1/2 -translate-y-1/2 overflow-hidden *:size-full", NODE_CLASS[variant])}
          style={{ left: `${place.left}%`, top: `${place.top}%`, rotate: `${place.rotate}deg`, width: size }}
        >
          {items[index]}
        </div>
      ))}
    </div>
  )
}

/** Rendered once. After that every node is moved by the engine, without React. */
function TrailPool({ layerRef, items, variant, size }: TrailPartProps & { layerRef: React.RefObject<HTMLDivElement | null> }) {
  const pool = items.length > 0 ? Array.from({ length: POOL_SIZE }, (_, index) => items[index % items.length]) : []
  return (
    <div ref={layerRef} aria-hidden="true" inert data-slot="image-trail-layer" className="pointer-events-none absolute inset-0 -z-10 select-none">
      {pool.map((item, index) => (
        <div key={index} data-slot="image-trail-node" className={cn("absolute top-0 left-0 overflow-hidden opacity-0 *:size-full", NODE_CLASS[variant])} style={{ width: size }}>
          {item}
        </div>
      ))}
    </div>
  )
}

function ImageTrail({ items, variant = "trail", effect, spacing = 72, size = 96, className, children, onPointerMove, onPointerLeave, ...props }: ImageTrailProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<TrailEngine | null>(null)
  const reduceMotion = useReducedMotion() ?? false
  const speed = effect === "speed"

  useEffect(() => {
    const root = rootRef.current
    const layer = layerRef.current
    if (!root || !layer) return
    const engine = createTrailEngine({ root, layer, variant, speed, spacing })
    engineRef.current = engine
    return () => {
      engine.dispose()
      engineRef.current = null
    }
  }, [speed, spacing, variant, items.length])

  const move = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event)
      if (reduceMotion || event.pointerType === "touch" || !isFinePointer()) return
      const box = event.currentTarget.getBoundingClientRect()
      engineRef.current?.move({ x: event.clientX - box.left, y: event.clientY - box.top }, event.timeStamp)
    },
    [onPointerMove, reduceMotion],
  )


  return (
    <div
      ref={rootRef}
      data-slot="image-trail"
      data-variant={variant}
      data-effect={effect}
      className={cn("group/trail relative isolate min-w-0 overflow-clip", className)}
      onPointerMove={move}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        engineRef.current?.leave()
      }}
      {...props}
    >
      <TrailStill items={items} variant={variant} size={size} />
      <TrailPool layerRef={layerRef} items={items} variant={variant} size={size} />
      {/* The soft edge keeps words legible where a picture passes behind them, without a panel that would hide the effect. */}
      <div data-slot="image-trail-content" className="relative h-full [text-shadow:0_0_2px_var(--background),0_0_6px_var(--background),0_0_6px_var(--background),0_0_14px_var(--background)]">
        {children}
      </div>
    </div>
  )
}

export { ImageTrail, type ImageTrailProps, type ImageTrailVariant, type ImageTrailEffect }
