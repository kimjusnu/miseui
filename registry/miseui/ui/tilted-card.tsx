import type * as React from "react"
import { useRef } from "react"
import { motion, useReducedMotion, useSpring, useTransform } from "motion/react"
import { GlareFace, LayersFace, PassFace, PhotoFace, TiltLayer, TiltLiftContext, type TiltLayerProps } from "@/registry/miseui/ui/tilted-card-parts"
import { clampTilt, MAX_TILT_DEGREES, PERSPECTIVE_PX, tiltFromPointer, tiltTransform } from "@/registry/miseui/ui/tilted-card-math"
import { cn } from "@/registry/miseui/lib/utils"

type TiltedCardVariant = "photo" | "glare" | "layers" | "pass"
type TiltedCardEffect = "drag"

const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)"
const TILT_SPRING = { bounce: 0, visualDuration: 0.35 }

type TiltedCardProps = Omit<React.ComponentProps<"div">, "ref"> & {
  /** `photo` a picture with a caption floating above it, `glare` a foil sheen that sweeps with the angle, `layers` parts on planes through `TiltLayer`, `pass` a ticket with a notched fold. */
  variant?: TiltedCardVariant
  /** `drag` lets a finger holding the card tilt it. The page still scrolls vertically, and it settles on release. */
  effect?: TiltedCardEffect
  /** Degrees at the edge, 12 at most: past that a corner leaves the reserved room. */
  maxTilt?: number
  /** `photo`: the line that floats above the picture. */
  caption?: React.ReactNode
  /** `pass`: what sits below the fold. */
  stub?: React.ReactNode
  /** `pass`: small terms at the foot of the stub. */
  finePrint?: React.ReactNode
}

function useTilt(maxTilt: number, dragEffect: boolean) {
  const reduceMotion = useReducedMotion()
  const rotateX = useSpring(0, TILT_SPRING)
  const rotateY = useSpring(0, TILT_SPRING)
  const lift = useSpring(0, TILT_SPRING)
  const held = useRef(false)

  const aim = (event: React.PointerEvent<HTMLDivElement>) => {
    // Measured on the still wrapper: reading the turning card would feed its own motion back into the pointer position.
    const box = event.currentTarget.getBoundingClientRect()
    const tilt = tiltFromPointer(event.clientX - box.left, event.clientY - box.top, box.width, box.height, maxTilt)
    rotateX.set(tilt.rotateX)
    rotateY.set(tilt.rotateY)
    lift.set(1)
  }
  const settle = () => {
    held.current = false
    rotateX.set(0)
    rotateY.set(0)
    lift.set(0)
  }
  const handlers = {
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragEffect || reduceMotion || event.pointerType === "mouse") return
      // No pointer capture. A captured touch retargets its click at this wrapper and a link inside would stop working.
      held.current = true
      aim(event)
    },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
      if (reduceMotion) return
      if (held.current || (event.pointerType === "mouse" && window.matchMedia(FINE_POINTER_QUERY).matches)) aim(event)
    },
    onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "mouse") settle()
    },
    onPointerCancel: settle,
    onPointerLeave: settle,
  }
  return { rotateX, rotateY, lift, handlers }
}

function TiltedCard({
  variant = "photo",
  effect,
  maxTilt = MAX_TILT_DEGREES,
  caption,
  stub,
  finePrint,
  className,
  style,
  children,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  ...props
}: TiltedCardProps) {
  const limit = clampTilt(maxTilt)
  const { rotateX, rotateY, lift, handlers } = useTilt(limit, effect === "drag")
  const transform = useTransform([rotateX, rotateY], ([x, y]) => tiltTransform(x as number, y as number))
  return (
    <div
      {...props}
      data-slot="tilted-card"
      data-variant={variant}
      data-effect={effect}
      // The padding is the room a corner swings through at full tilt, so a card in a narrow cell never widens the page.
      className={cn("min-w-0 p-2", effect === "drag" && "touch-pan-y", className)}
      style={{ perspective: PERSPECTIVE_PX, ...style }}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        handlers.onPointerDown(event)
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event)
        handlers.onPointerMove(event)
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event)
        handlers.onPointerUp(event)
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event)
        handlers.onPointerCancel()
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        handlers.onPointerLeave()
      }}
    >
      <TiltLiftContext.Provider value={lift}>
        <motion.div data-slot="tilted-card-surface" className="relative" style={{ transform, transformStyle: "preserve-3d" }}>
          <div aria-hidden="true" className="absolute inset-0 rounded-2xl shadow-[0_1px_2px_rgb(0_0_0/0.06),0_12px_24px_-16px_rgb(0_0_0/0.28)] dark:shadow-[0_1px_2px_rgb(0_0_0/0.5),0_12px_24px_-16px_rgb(0_0_0/0.8)]" />
          <motion.div aria-hidden="true" data-slot="tilted-card-shadow" className="absolute inset-0 rounded-2xl shadow-[0_24px_48px_-16px_rgb(0_0_0/0.3)] dark:shadow-[0_24px_48px_-16px_rgb(0_0_0/0.8)]" style={{ opacity: lift }} />
          {variant === "photo" ? <PhotoFace caption={caption}>{children}</PhotoFace> : null}
          {variant === "glare" ? <GlareFace rotateX={rotateX} rotateY={rotateY} lift={lift} maxTilt={limit}>{children}</GlareFace> : null}
          {variant === "layers" ? <LayersFace>{children}</LayersFace> : null}
          {variant === "pass" ? <PassFace stub={stub} finePrint={finePrint}>{children}</PassFace> : null}
        </motion.div>
      </TiltLiftContext.Provider>
    </div>
  )
}

export { TiltedCard, TiltLayer, type TiltedCardProps, type TiltedCardVariant, type TiltedCardEffect, type TiltLayerProps }
