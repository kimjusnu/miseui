import type * as React from "react"
import { useEffect, useRef, useSyncExternalStore } from "react"
import { animate, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { KnotFace, OrbFace, PanesFace } from "@/registry/miseui/ui/glass-core-faces"
import { leanFrom } from "@/registry/miseui/ui/glass-core-knot"
import { cn } from "@/registry/miseui/lib/utils"

type GlassCoreVariant = "knot" | "orb" | "panes"
type GlassCoreEffect = "follow" | "drift"

const FACE = { knot: KnotFace, orb: OrbFace, panes: PanesFace } as const
const REDUCED_TRANSPARENCY = "(prefers-reduced-transparency: reduce)"
const DRIFT_REACH = 0.6
const DRIFT_SECONDS = 9

function subscribeTransparency(onChange: () => void) {
  const query = window.matchMedia(REDUCED_TRANSPARENCY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

function useReducedTransparency() {
  return useSyncExternalStore(subscribeTransparency, () => window.matchMedia(REDUCED_TRANSPARENCY).matches, () => false)
}

function usePointerLean(rootRef: React.RefObject<HTMLElement | null>, enabled: boolean) {
  const leanX = useMotionValue(0)
  const leanY = useMotionValue(0)
  useEffect(() => {
    if (!enabled) return
    const onMove = (event: PointerEvent) => {
      const rect = rootRef.current?.getBoundingClientRect()
      if (!rect || event.pointerType === "touch") return
      animate(leanX, leanFrom(event.clientX, rect.left, rect.width), SPRING_DEFAULT)
      animate(leanY, leanFrom(event.clientY, rect.top, rect.height), SPRING_DEFAULT)
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => window.removeEventListener("pointermove", onMove)
  }, [enabled, leanX, leanY, rootRef])
  return { leanX, leanY }
}

/** The CSS faces have no frame loop of their own, so a drift is a slow sway on one value, held while off screen. */
function useCssDrift(rootRef: React.RefObject<HTMLElement | null>, enabled: boolean): MotionValue<number> {
  const sway = useMotionValue(0)
  useEffect(() => {
    const root = rootRef.current
    if (!enabled || !root) return
    const controls = animate(sway, [-DRIFT_REACH, DRIFT_REACH], {
      duration: DRIFT_SECONDS,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "mirror",
    })
    const view = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) controls.play()
      else controls.pause()
    })
    view?.observe(root)
    return () => {
      view?.disconnect()
      controls.stop()
    }
  }, [enabled, rootRef, sway])
  return sway
}

type GlassCoreProps = Omit<React.ComponentProps<"div">, "role"> & {
  /** `knot` a shaded tube drawn on a canvas, `orb` a CSS glass sphere, `panes` frosted sheets in CSS 3D. */
  variant?: GlassCoreVariant
  /** `follow` leans toward the pointer; `drift` also turns slowly while on screen. Both stay still under reduced motion. */
  effect?: GlassCoreEffect
  /** Say what it stands for when it carries meaning. Without it the object is decoration and hidden from assistive tech. */
  label?: string
}

function GlassCore({ variant = "knot", effect, label, className, children, ...props }: GlassCoreProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion() ?? false
  const solid = useReducedTransparency()
  const moving = !reduceMotion && effect !== undefined
  const drift = moving && effect === "drift"
  const { leanX, leanY } = usePointerLean(rootRef, moving)
  const sway = useCssDrift(rootRef, drift && variant !== "knot")
  const swayedX = useTransform([leanX, sway], ([lean = 0, offset = 0]) => (lean as number) + (offset as number))
  const swayedY = useTransform([leanY, sway], ([lean = 0, offset = 0]) => (lean as number) - (offset as number) / 2)
  const Face = FACE[variant]
  return (
    <div
      ref={rootRef}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-slot="glass-core"
      data-variant={variant}
      data-effect={effect}
      data-solid={solid || undefined}
      className={cn("relative isolate aspect-square w-full max-w-80 min-w-0", className)}
      {...props}
    >
      {/* Reduced transparency drops the light behind, since all it does is show through the glass. */}
      {solid ? null : <div data-slot="glass-core-glow" className="absolute inset-[22%] -z-10 rounded-full bg-mise opacity-50 blur-3xl" />}
      <Face leanX={swayedX} leanY={swayedY} drift={drift} solid={solid} />
      {children ? <div className="absolute inset-0 z-10 grid place-items-center">{children}</div> : null}
    </div>
  )
}

export { GlassCore, type GlassCoreProps, type GlassCoreVariant, type GlassCoreEffect }
