import type * as React from "react"
import { useState } from "react"
import { cn } from "@/registry/miseui/lib/utils"

type PointerHandlers = Pick<React.HTMLAttributes<HTMLDivElement>, "onPointerMove" | "onPointerLeave">

const POINTER_MASK = "radial-gradient(180px circle at var(--mise-bg-x) var(--mise-bg-y), #000, transparent)"
const POINTER_STYLE: React.CSSProperties = { maskImage: POINTER_MASK, WebkitMaskImage: POINTER_MASK }

function pointerOffset(clientX: number, clientY: number, box: Pick<DOMRect, "left" | "top">) {
  return { x: clientX - box.left, y: clientY - box.top }
}

/**
 * Listens on the box itself, never on window, so a background off screen costs nothing. Events from the content above
 * bubble up to it. The position goes straight into custom properties: nothing re-renders while the pointer moves.
 */
function useBackgroundPointer(enabled: boolean, { onPointerMove, onPointerLeave }: PointerHandlers) {
  const [lit, setLit] = useState(false)
  const handlers: PointerHandlers = {
    onPointerMove: (event) => {
      onPointerMove?.(event)
      // A finger has no hover to follow, and a light stuck where it last touched would look like a bug.
      if (!enabled || event.pointerType === "touch") return
      const box = event.currentTarget
      const { x, y } = pointerOffset(event.clientX, event.clientY, box.getBoundingClientRect())
      box.style.setProperty("--mise-bg-x", `${x}px`)
      box.style.setProperty("--mise-bg-y", `${y}px`)
      setLit(true)
    },
    onPointerLeave: (event) => {
      onPointerLeave?.(event)
      setLit(false)
    },
  }
  return { lit, handlers }
}

/** A second copy of the drawing in a brighter colour, shown only inside a circle around the pointer. */
function BackgroundPointerLayer({ lit, className, children }: { lit: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div
      data-slot="background-pointer-layer"
      className={cn("absolute inset-0 transition-opacity duration-(--duration-slow) ease-(--ease-mise) motion-reduce:transition-none", lit ? "opacity-100" : "opacity-0", className)}
      style={POINTER_STYLE}
    >
      {children}
    </div>
  )
}

export { BackgroundPointerLayer, pointerOffset, useBackgroundPointer }
