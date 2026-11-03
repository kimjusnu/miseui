import type * as React from "react"
import { useImperativeHandle, useState } from "react"
import { Slot } from "radix-ui"
import { fadeMask, isOverflowing, type EdgeDistances, type ScrollAxis } from "@/registry/miseui/ui/scroll-shadow-math"
import { useScrollEdges } from "@/registry/miseui/ui/scroll-shadow-state"
import { cn } from "@/registry/miseui/lib/utils"

type ScrollShadowVariant = "shadow" | "fade" | "line" | "none-at-rest"
type Edge = keyof EdgeDistances

const DEFAULT_FADE_PX = 32

const SCROLLER_CLASS: Record<ScrollAxis, string> = {
  y: "overflow-x-hidden overflow-y-auto",
  x: "overflow-x-auto overflow-y-hidden",
  both: "overflow-auto",
}

const EDGES: readonly Edge[] = ["top", "bottom", "left", "right"]

/**
 * Black, not a colour built from foreground: on a dark theme foreground is near white and the shadow turns into a glow.
 * The stronger dark value is because black barely shows on a near-black surface.
 */
const SHADOW_CLASS: Record<Edge, string> = {
  top: "inset-x-0 top-0 h-4 bg-linear-to-b from-black/10 to-transparent dark:from-black/50",
  bottom: "inset-x-0 bottom-0 h-4 bg-linear-to-t from-black/10 to-transparent dark:from-black/50",
  left: "inset-y-0 left-0 w-4 bg-linear-to-r from-black/10 to-transparent dark:from-black/50",
  right: "inset-y-0 right-0 w-4 bg-linear-to-l from-black/10 to-transparent dark:from-black/50",
}

const LINE_CLASS: Record<Edge, string> = {
  top: "inset-x-0 top-0 h-px bg-border",
  bottom: "inset-x-0 bottom-0 h-px bg-border",
  left: "inset-y-0 left-0 w-px bg-border",
  right: "inset-y-0 right-0 w-px bg-border",
}

type ScrollShadowProps = Omit<React.ComponentProps<"div">, "ref"> & {
  /** `shadow` soft shadows, `fade` the content itself dissolves, `line` a hairline, `none-at-rest` shadows only while scrolling. */
  variant?: ScrollShadowVariant
  /** Which way it scrolls. */
  axis?: ScrollAxis
  /** Uses your own scrolling child instead of a built-in div, such as a ul or a table wrapper. */
  asChild?: boolean
  /** Longest fade in `fade`, in px. */
  fadeSize?: number
  /** The element that scrolls. */
  scrollerRef?: React.Ref<HTMLElement | null>
  /** Classes for the scrolling element. className goes on the outer box, which is what you size. */
  scrollerClassName?: string
}

interface EdgeMarkProps {
  edge: Edge
  shown: boolean
  variant: ScrollShadowVariant
  awake: boolean
}

function EdgeMark({ edge, shown, variant, awake }: EdgeMarkProps) {
  const visible = shown && (variant !== "none-at-rest" || awake)
  return (
    <span
      aria-hidden="true"
      data-slot="scroll-shadow-edge"
      data-edge={edge}
      data-visible={visible ? "true" : "false"}
      className={cn(
        "pointer-events-none absolute z-10 transition-opacity duration-(--duration-fast) ease-(--ease-mise) motion-reduce:transition-none",
        variant === "line" ? LINE_CLASS[edge] : SHADOW_CLASS[edge],
        visible ? "opacity-100" : "opacity-0",
      )}
    />
  )
}

function ScrollShadow({ variant = "shadow", axis = "y", asChild = false, fadeSize = DEFAULT_FADE_PX, scrollerRef, scrollerClassName, className, children, tabIndex, role, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, ...props }: ScrollShadowProps) {
  const [node, setNode] = useState<HTMLElement | null>(null)
  useImperativeHandle<HTMLElement | null, HTMLElement | null>(scrollerRef, () => node, [node])
  const { edges, scrolling } = useScrollEdges(node, axis)
  const scrollable = isOverflowing(edges)
  const named = Boolean(ariaLabel || ariaLabelledBy)
  const Scroller = asChild ? Slot.Root : "div"
  const mask = variant === "fade" ? fadeMask(edges, fadeSize) : undefined
  return (
    <div
      data-slot="scroll-shadow"
      data-variant={variant}
      data-axis={axis}
      data-scrolling={scrolling ? "true" : "false"}
      // The tracks take the height and width set on this box, including a max-height, so the scroller inside has something to overflow.
      className={cn("relative grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)]", className)}
      {...props}
    >
      <Scroller
        ref={setNode}
        data-slot="scroll-shadow-scroller"
        // A scroller nothing can focus cannot be moved with the keyboard, unless it holds something focusable of its own.
        tabIndex={tabIndex ?? (scrollable ? 0 : undefined)}
        role={role ?? (named ? "region" : undefined)}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={cn("min-h-0 min-w-0 outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50", SCROLLER_CLASS[axis], scrollerClassName)}
        style={mask ? { maskImage: mask, WebkitMaskImage: mask, maskComposite: "intersect", WebkitMaskComposite: "source-in" } : undefined}
      >
        {children}
      </Scroller>
      {variant === "fade"
        ? null
        : EDGES.map((edge) => <EdgeMark key={edge} edge={edge} shown={edges[edge] > 0} variant={variant} awake={scrolling} />)}
    </div>
  )
}

export { ScrollShadow, type ScrollShadowProps, type ScrollShadowVariant, type ScrollAxis }
