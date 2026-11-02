import type * as React from "react"
import { Children, cloneElement, isValidElement, useEffect, useRef } from "react"
import { Slot } from "radix-ui"
import { useMotionTemplate, useMotionValueEvent, useReducedMotion, useSpring } from "motion/react"
import { BeamBorder } from "@/registry/miseui/ui/beam-border"
import { LiquidMetal } from "@/registry/miseui/ui/liquid-metal"
import { ShimmerText } from "@/registry/miseui/ui/shimmer-text"
import { cn } from "@/registry/miseui/lib/utils"

type ButtonEffect = "liquid" | "beam" | "shimmer" | "magnetic"

const BEAM_LENGTH_PX = 72
const BEAM_WIDTH_PX = 1.5
const BEAM_LAP_SECONDS = 3
const MAGNET_REACH_PX = 4
const MAGNET_SPRING = { bounce: 0, visualDuration: 0.35 }
const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)"
const SHIMMER_REST_SHARE = "45%"
/** Layout tokens that describe the visual unit, so they must also reach the frame around the button. */
const FRAME_TOKEN = /^(?:rounded|w-full$|flex-1$|grow$)/
/** The frame carries the press dip when it wraps the button, or the label would sink while its surface stays. */
const FRAME_PRESS_CLASS = "active:scale-100"

/**
 * Applied to the button itself, between its variant and the consumer's className.
 * Dark ink on every metal: both tints stay light in both themes, and --mise-foreground is dark in both.
 */
const EFFECT_SURFACE_CLASS: Record<ButtonEffect, string> = {
  liquid: cn(
    "border-transparent bg-transparent font-semibold text-mise-foreground shadow-none",
    "hover:bg-transparent hover:text-mise-foreground disabled:opacity-100",
    FRAME_PRESS_CLASS,
  ),
  beam: FRAME_PRESS_CLASS,
  // Loading is not "unavailable": a dimmed label would hide the one thing saying work is happening.
  shimmer: "disabled:opacity-100",
  magnetic: "",
}

/**
 * ShimmerText paints with --muted-foreground and --foreground on a transparent text fill, so currentColor
 * resolves to nothing inside it and each variant's ink has to be named. Outline and ghost already sit on
 * --foreground, and re-declaring a variable from itself would invalidate it, so they keep the defaults.
 */
const SHIMMER_INK: Partial<Record<string, string>> = {
  default: "var(--primary-foreground)",
  mise: "var(--mise-foreground)",
  destructive: "var(--color-white)",
  secondary: "var(--secondary-foreground)",
  link: "var(--primary)",
}

function shimmerStyle(variant: string | null | undefined) {
  const ink = SHIMMER_INK[variant ?? "default"]
  if (!ink) return undefined
  return {
    "--foreground": ink,
    "--muted-foreground": `color-mix(in oklab, ${ink} ${SHIMMER_REST_SHARE}, transparent)`,
  } as React.CSSProperties
}

function shimmerNodes(children: React.ReactNode, style: React.CSSProperties | undefined) {
  return Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <ShimmerText style={style}>{String(child)}</ShimmerText>
    ) : (
      child
    ),
  )
}

/** Text runs through the shimmer, icons stay as they are. With asChild the text lives one level down, in the child. */
function shimmerLabel(children: React.ReactNode, asChild: boolean, variant: string | null | undefined) {
  const style = shimmerStyle(variant)
  if (asChild && isValidElement<{ children?: React.ReactNode }>(children)) {
    return cloneElement(children, undefined, shimmerNodes(children.props.children, style))
  }
  return shimmerNodes(children, style)
}

/** -1..1 share of the half-size; a zero-size element has nowhere to pull to. */
function pullShare(delta: number, half: number) {
  if (half <= 0) return 0
  return Math.min(1, Math.max(-1, delta / half))
}

/**
 * Writes the CSS `translate` property, which composes with the `scale` that active:scale sets, so the press
 * dip stays instant. Going through Slot means no wrapper and no motion.button, so asChild keeps working.
 */
function MagneticSlot({ disabled, children }: { disabled: boolean; children: React.ReactElement }) {
  const reduceMotion = useReducedMotion()
  const nodeRef = useRef<HTMLElement>(null)
  const x = useSpring(0, MAGNET_SPRING)
  const y = useSpring(0, MAGNET_SPRING)
  const translate = useMotionTemplate`${x}px ${y}px`

  useMotionValueEvent(translate, "change", (value) => {
    if (nodeRef.current) nodeRef.current.style.translate = value
  })

  // A button disabled mid-hover stops receiving pointer events, so pointerleave would never bring it home.
  useEffect(() => {
    if (!disabled) return
    x.set(0)
    y.set(0)
  }, [disabled, x, y])

  const pull = (event: React.PointerEvent<HTMLElement>) => {
    if (reduceMotion || !window.matchMedia(FINE_POINTER_QUERY).matches) return
    const rect = event.currentTarget.getBoundingClientRect()
    // The rect already includes the drift; without subtracting it the button would chase its own offset.
    const centerX = rect.left + rect.width / 2 - x.get()
    const centerY = rect.top + rect.height / 2 - y.get()
    x.set(pullShare(event.clientX - centerX, rect.width / 2) * MAGNET_REACH_PX)
    y.set(pullShare(event.clientY - centerY, rect.height / 2) * MAGNET_REACH_PX)
  }

  const release = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <Slot.Root ref={nodeRef} onPointerMove={pull} onPointerLeave={release}>
      {children}
    </Slot.Root>
  )
}

interface ButtonEffectFrameProps {
  effect: Exclude<ButtonEffect, "shimmer">
  variant: string | null | undefined
  size: string | null | undefined
  className: string | undefined
  disabled: boolean
  children: React.ReactElement
}

function frameClass(size: string | null | undefined, className: string | undefined) {
  const inherited = (className ?? "").split(/\s+/).filter((token) => FRAME_TOKEN.test(token))
  return cn("inline-flex w-fit has-active:scale-[0.97]", size === "lg" ? "rounded-full" : "rounded-md", inherited)
}

function ButtonEffectFrame({ effect, variant, size, className, disabled, children }: ButtonEffectFrameProps) {
  if (effect === "magnetic") return <MagneticSlot disabled={disabled}>{children}</MagneticSlot>
  const frame = frameClass(size, className)
  const isMise = variant === "mise"
  if (effect === "beam") {
    return (
      <BeamBorder
        active={!disabled}
        // A warm beam on a warm surface would vanish.
        color={isMise ? "foreground" : "mise"}
        size={BEAM_LENGTH_PX}
        borderWidth={BEAM_WIDTH_PX}
        duration={BEAM_LAP_SECONDS}
        className={frame}
      >
        {children}
      </BeamBorder>
    )
  }
  return (
    <LiquidMetal
      tint={isMise ? "mise" : "silver"}
      speed={disabled ? 0 : undefined}
      className={cn(
        frame,
        "transition-[filter] duration-(--duration-fast) ease-(--ease-mise) has-disabled:opacity-50",
        !disabled && "hover:brightness-110",
        // Without WebGL2 there is no canvas behind the transparent button.
        "data-[fallback=true]:bg-mise",
      )}
    >
      {children}
    </LiquidMetal>
  )
}

export { ButtonEffectFrame, EFFECT_SURFACE_CLASS, shimmerLabel, type ButtonEffect }
