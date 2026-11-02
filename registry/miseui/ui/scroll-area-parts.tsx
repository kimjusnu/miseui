import type * as React from "react"
import { useEffect } from "react"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"
import { cn } from "@/registry/miseui/lib/utils"

type ScrollAreaVariant = "plain" | "overlay" | "shadow" | "snap"
type ScrollAxis = "x" | "y"
type BarOrientation = "vertical" | "horizontal"

/** How far from an edge the cue reaches full strength, in px. Matches the fade length in the mask below. */
const EDGE_RANGE_PX = 24

const BAR_AXIS_CLASS: Record<BarOrientation, string> = {
  vertical: "h-full",
  horizontal: "flex-col",
}

const BAR_SIZE_CLASS: Record<Exclude<ScrollAreaVariant, "snap">, Record<BarOrientation, string>> = {
  plain: { vertical: "w-3", horizontal: "h-3" },
  // Thin until the pointer reaches for it, so it floats over the content without covering any.
  overlay: { vertical: "w-2 hover:w-3", horizontal: "h-2 hover:h-3" },
  shadow: { vertical: "w-2", horizontal: "h-2" },
}

const THUMB_CLASS: Record<Exclude<ScrollAreaVariant, "snap">, string> = {
  plain: "bg-border hover:bg-muted-foreground/50",
  overlay: "bg-foreground/30 hover:bg-foreground/50",
  shadow: "bg-foreground/20 hover:bg-foreground/40",
}

const EDGE_CLASS: Record<ScrollAxis, Record<"start" | "end", string>> = {
  y: {
    start: "inset-x-0 top-0 h-4 bg-linear-to-b opacity-(--scroll-start)",
    end: "inset-x-0 bottom-0 h-4 bg-linear-to-t opacity-(--scroll-end)",
  },
  x: {
    start: "inset-y-0 left-0 w-4 bg-linear-to-r opacity-(--scroll-start)",
    end: "inset-y-0 right-0 w-4 bg-linear-to-l opacity-(--scroll-end)",
  },
}

const FADE_CLASS: Record<ScrollAxis, string> = {
  y: "[mask-image:linear-gradient(to_bottom,transparent,black_calc(var(--scroll-start,0)*24px),black_calc(100%-var(--scroll-end,0)*24px),transparent)]",
  x: "[mask-image:linear-gradient(to_right,transparent,black_calc(var(--scroll-start,0)*24px),black_calc(100%-var(--scroll-end,0)*24px),transparent)]",
}

/** 0 at an edge, 1 once there are EDGE_RANGE_PX of content beyond it, so a cue grows with the scroll instead of popping in. */
function edgeProgress(distancePx: number) {
  return Math.min(1, Math.max(0, distancePx / EDGE_RANGE_PX))
}

function measureEdges(viewport: HTMLElement, axis: ScrollAxis) {
  // scrollLeft runs negative in right-to-left layouts.
  const position = Math.abs(axis === "y" ? viewport.scrollTop : viewport.scrollLeft)
  const overflow =
    axis === "y" ? viewport.scrollHeight - viewport.clientHeight : viewport.scrollWidth - viewport.clientWidth
  return { start: edgeProgress(position), end: edgeProgress(overflow - position) }
}

/** Writes straight to CSS variables: this runs on every scroll event and must not re-render the content. */
function useScrollEdges(viewportRef: React.RefObject<HTMLDivElement | null>, axis: ScrollAxis, enabled: boolean) {
  useEffect(() => {
    const viewport = viewportRef.current
    const root = viewport?.parentElement
    if (!enabled || !viewport || !root) return
    const update = () => {
      const { start, end } = measureEdges(viewport, axis)
      root.style.setProperty("--scroll-start", String(start))
      root.style.setProperty("--scroll-end", String(end))
    }
    update()
    viewport.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    if (viewport.firstElementChild) observer.observe(viewport.firstElementChild)
    return () => {
      viewport.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [viewportRef, axis, enabled])
}

function Scrollbar({ variant, orientation }: { variant: Exclude<ScrollAreaVariant, "snap">; orientation: BarOrientation }) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-variant={variant}
      orientation={orientation}
      className={cn(
        "flex touch-none p-0.5 select-none",
        "transition-[width,height,opacity] duration-(--duration-fast) ease-(--ease-mise) motion-reduce:transition-none",
        "data-[state=hidden]:animate-out data-[state=hidden]:fade-out-0 data-[state=visible]:animate-in data-[state=visible]:fade-in-0",
        BAR_AXIS_CLASS[orientation],
        BAR_SIZE_CLASS[variant][orientation],
      )}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className={cn(
          "relative flex-1 rounded-full transition-colors duration-(--duration-fast) ease-(--ease-mise)",
          // The bar is far thinner than a fingertip; this gives it a 40 px target on touch.
          "pointer-coarse:before:absolute pointer-coarse:before:top-1/2 pointer-coarse:before:left-1/2 pointer-coarse:before:size-10 pointer-coarse:before:-translate-1/2",
          THUMB_CLASS[variant],
        )}
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

function EdgeShadow({ axis, side }: { axis: ScrollAxis; side: "start" | "end" }) {
  return (
    <div
      aria-hidden="true"
      data-part={`edge-${side}`}
      className={cn("pointer-events-none absolute from-foreground/10 to-transparent dark:from-black/50", EDGE_CLASS[axis][side])}
    />
  )
}

export { EdgeShadow, FADE_CLASS, Scrollbar, edgeProgress, useScrollEdges, type ScrollAreaVariant, type ScrollAxis }
