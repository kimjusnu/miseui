import type * as React from "react"
import { useRef } from "react"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"
import {
  EdgeShadow,
  FADE_CLASS,
  Scrollbar,
  edgeProgress,
  useScrollEdges,
  type ScrollAreaVariant,
  type ScrollAxis,
} from "@/registry/miseui/ui/scroll-area-parts"
import { cn } from "@/registry/miseui/lib/utils"

type ScrollAreaEffect = "edge-fade"
type ScrollAreaOrientation = "vertical" | "horizontal" | "both"
type RootType = NonNullable<React.ComponentProps<typeof ScrollAreaPrimitive.Root>["type"]>

const DEFAULT_TYPE: Record<ScrollAreaVariant, RootType> = {
  plain: "hover",
  overlay: "scroll",
  shadow: "scroll",
  snap: "hover",
}

type ScrollAreaProps = React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  /** `plain` a bar on hover, `overlay` a thin floating bar while scrolling, `shadow` edges that say more is there, `snap` a row that stops on each child. */
  variant?: ScrollAreaVariant
  /** `edge-fade` fades content out at the edges through a mask. Removed under reduced transparency. */
  effect?: ScrollAreaEffect
  /** Defaults to `horizontal` for `snap` and `vertical` otherwise. */
  orientation?: ScrollAreaOrientation
  /** Classes for the scrolling element itself. */
  viewportClassName?: string
}

function SnapTrack({ axis, children }: { axis: ScrollAxis; children: React.ReactNode }) {
  return (
    <div data-part="snap-track" className={cn("gap-3 *:snap-start", axis === "x" ? "flex w-max *:shrink-0" : "grid")}>
      {children}
    </div>
  )
}

function ScrollChrome({ variant, orientation, axis }: { variant: ScrollAreaVariant; orientation: ScrollAreaOrientation; axis: ScrollAxis }) {
  if (variant === "snap") return null
  return (
    <>
      {variant === "shadow" ? (
        <>
          <EdgeShadow axis={axis} side="start" />
          <EdgeShadow axis={axis} side="end" />
        </>
      ) : null}
      {orientation !== "horizontal" ? <Scrollbar variant={variant} orientation="vertical" /> : null}
      {orientation !== "vertical" ? <Scrollbar variant={variant} orientation="horizontal" /> : null}
      {orientation === "both" ? <ScrollAreaPrimitive.Corner data-slot="scroll-area-corner" /> : null}
    </>
  )
}

function viewportClass(variant: ScrollAreaVariant, orientation: ScrollAreaOrientation, axis: ScrollAxis, fade: boolean) {
  const snapClass = axis === "x" ? "snap-x snap-mandatory overscroll-x-contain" : "snap-y snap-mandatory overscroll-y-contain"
  return cn(
    "size-full rounded-[inherit] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset",
    // Radix wraps content in display: table, which lets text push wider than the viewport and never wrap.
    orientation === "vertical" && "[&>div]:block!",
    variant === "snap" && snapClass,
    fade && FADE_CLASS[axis],
    fade && "[@media(prefers-reduced-transparency:reduce)]:[mask-image:none]",
  )
}

function ScrollArea({
  variant = "plain",
  effect,
  orientation = variant === "snap" ? "horizontal" : "vertical",
  type = DEFAULT_TYPE[variant],
  className,
  viewportClassName,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: ScrollAreaProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const axis: ScrollAxis = orientation === "horizontal" ? "x" : "y"
  const fade = effect === "edge-fade"
  useScrollEdges(viewportRef, axis, variant === "shadow" || fade)
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      data-variant={variant}
      data-effect={effect}
      data-orientation={orientation}
      type={type}
      // Starts at 0 so no cue flashes before the first measure; the measure then overrides these inline.
      className={cn("relative overflow-hidden [--scroll-end:0] [--scroll-start:0]", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        data-slot="scroll-area-viewport"
        // A scroller the keyboard cannot reach is a dead end for anyone without a wheel.
        tabIndex={0}
        role={ariaLabel !== undefined || ariaLabelledBy !== undefined ? "region" : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={cn(viewportClass(variant, orientation, axis, fade), viewportClassName)}
      >
        {variant === "snap" ? <SnapTrack axis={axis}>{children}</SnapTrack> : children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollChrome variant={variant} orientation={orientation} axis={axis} />
    </ScrollAreaPrimitive.Root>
  )
}

export { ScrollArea, edgeProgress, type ScrollAreaProps, type ScrollAreaVariant, type ScrollAreaEffect, type ScrollAreaOrientation }
