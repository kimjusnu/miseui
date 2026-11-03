import type * as React from "react"
import { useEffect, useRef, useState } from "react"
import { useBackgroundPlayback } from "@/registry/miseui/ui/background-loop"
import { cn } from "@/registry/miseui/lib/utils"

export interface CardStackItem {
  id: string
  /** Announced when it comes to the top, and named in the status line. */
  label: string
  content: React.ReactNode
}

export interface CardStackLabels {
  next: string
  spread: string
  gather: string
  showAll: string
  collapse: string
  left: string
  right: string
  done: string
  again: string
}

export const DEFAULT_LABELS: CardStackLabels = {
  next: "Next",
  spread: "Spread",
  gather: "Stack up",
  showAll: "Show all",
  collapse: "Collapse",
  left: "Skip",
  right: "Keep",
  done: "All done",
  again: "Start over",
}

/** What each look receives from the root. */
export interface StackVariantProps {
  items: readonly CardStackItem[]
  label?: string
  autoplay: boolean
  paused: boolean
  interval: number
  seed: number
  labels: CardStackLabels
  rootProps: React.ComponentProps<"div">
}

export const CARD_CLASS = "rounded-xl border bg-card p-4 text-card-foreground"
/** Every card shares one grid cell, so the cell is exactly as tall as the tallest card and nothing jumps when the top changes. */
export const STACK_CELL = "[grid-area:1/1] min-w-0"
export const SURFACE_SHADOW = "shadow-[0_1px_2px_rgb(0_0_0/0.05),0_8px_16px_-12px_rgb(0_0_0/0.2)] dark:shadow-[0_1px_2px_rgb(0_0_0/0.5),0_8px_16px_-12px_rgb(0_0_0/0.7)]"
export const CONTROL_ROW = "flex min-h-10 flex-wrap items-center justify-between gap-2"
/** A card dragged past the edge of a narrow column would otherwise widen the whole page. The margin leaves it room to read as moving away. */
export const DRAG_CLIP = "overflow-x-clip [overflow-clip-margin:24px]"

/** A card out of reach must be out of reach for everything: no focus, no reading, no clicking through. */
export function reachable(active: boolean): { inert?: boolean; "aria-hidden"?: true } {
  return active ? {} : { inert: true, "aria-hidden": true }
}

/** A tap focuses a control too, and that must not count as the keyboard arriving, or the same tap would open and then toggle shut. */
export function isKeyboardFocus(target: EventTarget) {
  try {
    return target instanceof Element && target.matches(":focus-visible")
  } catch {
    return true
  }
}

const INTERACTIVE = "a, button, input, select, textarea, label, [role='button'], [tabindex]"

/** A press on the stack toggles it, unless it landed on a control inside a card. */
export function pressedControl(target: EventTarget) {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}

interface StackStatusProps {
  text: string
  /** Off while autoplay turns the cards: being interrupted every few seconds is worse than not being told. */
  live?: boolean
}

export function StackStatus({ text, live = true }: StackStatusProps) {
  return (
    <p data-slot="card-stack-status" className="min-w-0 text-[13px] text-muted-foreground tabular-nums" aria-live={live ? "polite" : "off"}>
      {text}
    </p>
  )
}

interface AutoplayOptions {
  enabled: boolean
  paused: boolean
  /** Hover or focus inside the stack, or a state where turning would pull something away from someone. */
  held: boolean
  intervalMs: number
  onTurn: () => void
}

/** Same loop rules as a background: on screen, visible tab, not paused, not reduced motion. */
export function useAutoplay(rootRef: React.RefObject<HTMLElement | null>, { enabled, paused, held, intervalMs, onTurn }: AutoplayOptions) {
  const { playing } = useBackgroundPlayback(rootRef, { paused, loops: enabled })
  const latestTurn = useRef(onTurn)
  useEffect(() => {
    latestTurn.current = onTurn
  })
  const running = enabled && playing && !held
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => latestTurn.current(), intervalMs)
    return () => window.clearInterval(timer)
  }, [running, intervalMs])
  return running
}

/** Tracks pointer and focus inside the stack, so autoplay stops while someone is on it. */
export function useHeld() {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  return {
    held: hovered || focused,
    heldProps: {
      // A finger fires enter on touch down and leave on lift, so this also holds still under a drag.
      onPointerEnter: () => setHovered(true),
      onPointerLeave: () => setHovered(false),
      onFocus: () => setFocused(true),
      onBlur: (event: React.FocusEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      },
    },
  }
}

type RootHandlers = Pick<React.ComponentProps<"div">, "onPointerEnter" | "onPointerLeave" | "onFocus" | "onBlur" | "onKeyDown">

function chain<Event>(owner?: (event: Event) => void, own?: (event: Event) => void) {
  return (event: Event) => {
    owner?.(event)
    own?.(event)
  }
}

/** The root needs these for itself, and they arrive in the same props the owner uses. Spreading one over the other would silently drop the owner's. */
export function composeHandlers(owner: RootHandlers, own: RootHandlers): RootHandlers {
  return {
    onPointerEnter: chain(owner.onPointerEnter, own.onPointerEnter),
    onPointerLeave: chain(owner.onPointerLeave, own.onPointerLeave),
    onFocus: chain(owner.onFocus, own.onFocus),
    onBlur: chain(owner.onBlur, own.onBlur),
    onKeyDown: chain(owner.onKeyDown, own.onKeyDown),
  }
}

export function StackRoot({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div {...props} role="group" aria-roledescription="card stack" className={cn("grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-3", className)}>
      {children}
    </div>
  )
}
