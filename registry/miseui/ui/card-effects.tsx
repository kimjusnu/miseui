import type * as React from "react"
import { useEffect, useState } from "react"
import { motion, useReducedMotion, useSpring, type HTMLMotionProps } from "motion/react"
import { BeamBorder, type BeamBorderProps } from "@/registry/miseui/ui/beam-border"
import { Materialize, type MaterializeProps } from "@/registry/miseui/ui/materialize"
import { cn } from "@/registry/miseui/lib/utils"

type CardEffect = "beam" | "spotlight" | "tilt" | "materialize"
type CardRootProps = React.ComponentProps<"div">

const BEAM_LENGTH_PX = 220
const BEAM_WIDTH_PX = 2
const TILT_MAX_DEGREES = 3
const TILT_PERSPECTIVE_PX = 900
const TILT_SPRING = { bounce: 0, visualDuration: 0.35 }
const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)"
/** Keyboard users and reduced motion get the highlight resting on the top edge, where a lit edge reads as "active". */
const SPOT_AT = "at var(--spot-x, 50%) var(--spot-y, 0%)"
const SPOT_FILL = `radial-gradient(420px circle ${SPOT_AT}, color-mix(in oklab, var(--mise) 26%, transparent), transparent 72%)`
const SPOT_RIM = `radial-gradient(280px circle ${SPOT_AT}, var(--mise), transparent 72%)`
const GLARE_FILL = `radial-gradient(360px circle ${SPOT_AT}, color-mix(in oklab, var(--foreground) 9%, transparent), transparent 72%)`
/** Content box cut out of the border box leaves only the padding ring painted. */
const RING_MASK = "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)"
const HOVER_LAYER_CLASS = cn(
  "pointer-events-none absolute -z-10 rounded-[inherit] opacity-0",
  "transition-opacity duration-(--duration-base) ease-(--ease-mise) motion-reduce:transition-none",
  "group-hover/card:opacity-100 group-focus-within/card:opacity-100",
)

function canFollowPointer(reduceMotion: boolean | null) {
  return !reduceMotion && window.matchMedia(FINE_POINTER_QUERY).matches
}

/** Written straight to the element: a pointer stream must not re-render the card and everything inside it. */
function writeSpot(event: React.PointerEvent<HTMLDivElement>, rect: DOMRect) {
  const { style } = event.currentTarget
  style.setProperty("--spot-x", `${event.clientX - rect.left}px`)
  style.setProperty("--spot-y", `${event.clientY - rect.top}px`)
}

/** The card itself is the beam's root, so its width, grid slot and ref behave as on a plain card. */
function BeamCard({ className, ...props }: CardRootProps) {
  return (
    <BeamBorder
      size={BEAM_LENGTH_PX}
      borderWidth={BEAM_WIDTH_PX}
      {...(props as BeamBorderProps)}
      className={cn(className, "border-transparent")}
    />
  )
}

function SpotlightCard({ className, onPointerMove, children, ...props }: CardRootProps) {
  const reduceMotion = useReducedMotion()
  const follow = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event)
    if (canFollowPointer(reduceMotion)) writeSpot(event, event.currentTarget.getBoundingClientRect())
  }
  return (
    <div className={cn("group/card relative isolate", className)} onPointerMove={follow} {...props}>
      <span
        aria-hidden="true"
        data-testid="card-spot"
        className={cn(HOVER_LAYER_CLASS, "inset-0")}
        style={{ background: SPOT_FILL }}
      />
      <span
        aria-hidden="true"
        data-testid="card-spot-rim"
        className={cn(HOVER_LAYER_CLASS, "-inset-px")}
        style={{ background: SPOT_RIM, padding: 1, mask: RING_MASK, maskComposite: "exclude" }}
      />
      {children}
    </div>
  )
}

function TiltCard({ className, style, onPointerMove, onPointerLeave, children, ...props }: CardRootProps) {
  const reduceMotion = useReducedMotion()
  const rotateX = useSpring(0, TILT_SPRING)
  const rotateY = useSpring(0, TILT_SPRING)

  const follow = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event)
    if (!canFollowPointer(reduceMotion)) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const shareX = (event.clientX - rect.left) / rect.width - 0.5
    const shareY = (event.clientY - rect.top) / rect.height - 0.5
    // The edge under the pointer comes forward. Tilting it away would slide the card out from under
    // a pointer near that edge, firing leave, then enter, in a loop.
    rotateY.set(-shareX * 2 * TILT_MAX_DEGREES)
    rotateX.set(shareY * 2 * TILT_MAX_DEGREES)
    writeSpot(event, rect)
  }
  const settle = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(event)
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      {...(props as HTMLMotionProps<"div">)}
      className={cn(
        "group/card relative isolate transition-shadow duration-(--duration-base) ease-(--ease-mise) hover:shadow-lg",
        className,
      )}
      style={{ ...(style as HTMLMotionProps<"div">["style"]), rotateX, rotateY, transformPerspective: TILT_PERSPECTIVE_PX }}
      onPointerMove={follow}
      onPointerLeave={settle}
    >
      {/* Glass catches a little light as it turns; without it, 3 degrees reads as a layout wobble. */}
      <span
        aria-hidden="true"
        data-testid="card-glare"
        className={cn(HOVER_LAYER_CLASS, "inset-0")}
        style={{ background: GLARE_FILL }}
      />
      {children}
    </motion.div>
  )
}

/**
 * Materialize only animates a false-to-true flip of `show` (its presence is initial={false}), so the card
 * mounts hidden and flips on the next frame. The trap: server-rendered HTML holds no card content.
 */
function MaterializeCard({ children, ...props }: CardRootProps) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  return (
    <Materialize show={show} {...(props as Omit<MaterializeProps, "show" | "children">)}>
      {children}
    </Materialize>
  )
}

const CARD_EFFECT_ROOTS: Record<CardEffect, (props: CardRootProps) => React.JSX.Element> = {
  beam: BeamCard,
  spotlight: SpotlightCard,
  tilt: TiltCard,
  materialize: MaterializeCard,
}

export { CARD_EFFECT_ROOTS, type CardEffect }
