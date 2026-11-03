import type * as React from "react"
import { useCallback, useContext, useEffect, useMemo, useRef } from "react"
import { motion, useMotionValue, useReducedMotion, useTransform } from "motion/react"
import { MagnetBodyContext, MagnetGroupContext, useDocumentPointer, useMagnetForce, type PointerListener } from "@/registry/miseui/ui/magnet-state"
import { cn } from "@/registry/miseui/lib/utils"

type MagnetVariant = "pull" | "layers" | "field" | "halo"
type MagnetEffect = "sticky"

const DEFAULT_REACH = 96
const DEFAULT_STRENGTH: Record<MagnetVariant, number> = { pull: 0.35, layers: 0.12, field: 0.25, halo: 0.2 }
/** A field sits in a row with gaps of about 8 px, and an item that travels further lands on its neighbour. */
const DEFAULT_MAX_OFFSET: Record<MagnetVariant, number> = { pull: 16, layers: 6, field: 4, halo: 10 }

type MagnetProps = Omit<React.ComponentProps<"div">, "ref"> & {
  /** `pull` the whole element drifts, `layers` inner MagnetLayer parts move further than the surface, `field` reacts inside a MagnetGroup, `halo` the element stays and a soft ring trails. */
  variant?: MagnetVariant
  /** `sticky` latches once close and lets go only past a wider radius. */
  effect?: MagnetEffect
  /** How far past its own bounds it reacts, in px. Ignored inside a MagnetGroup, which sets it for the row. */
  reach?: number
  /** The share of the distance to the pointer it moves. */
  strength?: number
  /** The furthest it travels, in px. */
  maxOffset?: number
  /** For the `halo` ring, to match the corners of what it surrounds. */
  haloClassName?: string
}

/** Blurred once and moved by transform. The blur itself never animates, so moving it costs only a compositor layer. */
const HALO_CLASS =
  "pointer-events-none absolute -inset-2 -z-10 rounded-2xl border-[5px] border-mise blur-[4px] [@media(prefers-reduced-transparency:reduce)]:hidden"

function Magnet({ variant: variantProp, effect, reach: reachProp, strength, maxOffset, haloClassName, className, children, ...props }: MagnetProps) {
  const group = useContext(MagnetGroupContext)
  const reduceMotion = useReducedMotion() ?? false
  const variant = variantProp ?? (group ? "field" : "pull")
  const reach = group?.reach ?? reachProp ?? DEFAULT_REACH
  const rootRef = useRef<HTMLDivElement>(null)
  const force = useMagnetForce(rootRef, {
    reach,
    strength: strength ?? DEFAULT_STRENGTH[variant],
    maxOffset: maxOffset ?? DEFAULT_MAX_OFFSET[variant],
    sticky: effect === "sticky",
  })
  const { move, end, x, y, near } = force
  const listener = useMemo<PointerListener>(() => ({ move, end }), [move, end])
  // Inside a group the row owns one listener; a lone magnet brings its own.
  useDocumentPointer(rootRef, listener, !group && !reduceMotion)
  useEffect(() => (group && !reduceMotion ? group.add(listener) : undefined), [group, listener, reduceMotion])
  const bodyValue = useMemo(() => ({ x, y }), [x, y])
  const scale = useTransform(near, [0, 1], [1, 1.06])
  const haloOpacity = useTransform(near, [0, 1], [0, 0.55])
  const style = variant === "halo" ? undefined : variant === "field" ? { x, y, scale } : { x, y }
  return (
    <div
      ref={rootRef}
      data-slot="magnet"
      data-variant={variant}
      data-effect={effect}
      data-latched={force.latched ? "true" : undefined}
      className={cn("relative isolate inline-block max-w-full align-middle", className)}
      {...props}
    >
      {variant === "halo" ? <motion.span aria-hidden="true" data-slot="magnet-halo" className={cn(HALO_CLASS, haloClassName)} style={{ x, y, opacity: haloOpacity }} /> : null}
      <motion.div data-slot="magnet-body" style={style}>
        <MagnetBodyContext.Provider value={bodyValue}>{children}</MagnetBodyContext.Provider>
      </motion.div>
    </div>
  )
}

type MagnetLayerProps = Omit<React.ComponentProps<"div">, "ref" | "style"> & {
  /** How much further than the surface this part moves. 1 doubles the surface's travel. */
  depth?: number
  style?: React.CSSProperties
}

function MagnetLayer({ depth = 1, className, style, ...props }: MagnetLayerProps) {
  const body = useContext(MagnetBodyContext)
  const still = useMotionValue(0)
  const x = useTransform(body?.x ?? still, (value) => value * depth)
  const y = useTransform(body?.y ?? still, (value) => value * depth)
  return (
    <motion.div
      data-slot="magnet-layer"
      className={className}
      style={{ ...style, x, y }}
      {...(props as React.ComponentProps<typeof motion.div>)}
    />
  )
}

type MagnetGroupProps = React.ComponentProps<"div"> & {
  /** How far each item reacts, in px. */
  reach?: number
}

/** One listener for the whole row, so twenty items cost one event handler. */
function MagnetGroup({ reach = 120, className, children, ...props }: MagnetGroupProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion() ?? false
  const listeners = useRef<readonly PointerListener[]>([])
  const add = useCallback((listener: PointerListener) => {
    listeners.current = [...listeners.current, listener]
    return () => {
      listeners.current = listeners.current.filter((entry) => entry !== listener)
    }
  }, [])
  const shared = useMemo<PointerListener>(
    () => ({
      move: (point) => listeners.current.forEach((listener) => listener.move(point)),
      end: () => listeners.current.forEach((listener) => listener.end()),
    }),
    [],
  )
  useDocumentPointer(rootRef, shared, !reduceMotion)
  const value = useMemo(() => ({ reach, add }), [reach, add])
  return (
    <MagnetGroupContext.Provider value={value}>
      <div ref={rootRef} data-slot="magnet-group" className={cn("flex min-w-0 flex-wrap items-center gap-2", className)} {...props}>
        {children}
      </div>
    </MagnetGroupContext.Provider>
  )
}

export { Magnet, MagnetLayer, MagnetGroup, type MagnetProps, type MagnetLayerProps, type MagnetGroupProps, type MagnetVariant, type MagnetEffect }
