import type * as React from "react"
import { cn } from "@/registry/miseui/lib/utils"

type ResizableVariant = "line" | "grip" | "gap" | "hidden"
type HandleAxis = "x" | "y"

const HANDLE_AXIS_CLASS: Record<HandleAxis, string> = {
  // The visible part is often 1 px wide; the pseudo-element is what the hand actually aims at.
  x: "cursor-col-resize after:inset-y-0 after:-inset-x-2 pointer-coarse:after:-inset-x-5",
  y: "cursor-row-resize after:inset-x-0 after:-inset-y-2 pointer-coarse:after:-inset-y-5",
}

const HANDLE_CLASS: Record<ResizableVariant, Record<HandleAxis, string>> = {
  line: { x: "w-px bg-border", y: "h-px bg-border" },
  grip: { x: "w-3 border-x bg-muted", y: "h-3 border-y bg-muted" },
  gap: { x: "w-2", y: "h-2" },
  hidden: { x: "w-0", y: "h-0" },
}

const LINE_ACTIVE_CLASS = "hover:bg-foreground/30 focus-visible:bg-mise data-[dragging=true]:bg-mise"

const MARK_CLASS: Record<Exclude<ResizableVariant, "line">, Record<HandleAxis, string>> = {
  grip: { x: "h-8 w-1 rounded-full bg-muted-foreground/40", y: "h-1 w-8 rounded-full bg-muted-foreground/40" },
  gap: { x: "h-8 w-1 rounded-full bg-muted-foreground/60", y: "h-1 w-8 rounded-full bg-muted-foreground/60" },
  hidden: { x: "absolute inset-y-0 w-0.5 bg-mise", y: "absolute inset-x-0 h-0.5 bg-mise" },
}

/** `grip` is always on show; `gap` and `hidden` keep their mark out of sight until someone reaches for the handle. */
const MARK_REVEAL_CLASS: Record<Exclude<ResizableVariant, "line">, string> = {
  grip: "group-hover/handle:bg-muted-foreground group-data-[dragging=true]/handle:bg-mise",
  gap: "opacity-0 group-hover/handle:opacity-100 group-focus-visible/handle:opacity-100 group-data-[dragging=true]/handle:bg-mise group-data-[dragging=true]/handle:opacity-100",
  hidden: "opacity-0 group-hover/handle:opacity-100 group-focus-visible/handle:opacity-100 group-data-[dragging=true]/handle:opacity-100",
}

function HandleMark({ variant, axis }: { variant: ResizableVariant; axis: HandleAxis }) {
  if (variant === "line") return null
  return (
    <span
      aria-hidden="true"
      data-part="mark"
      className={cn(
        "transition-[opacity,background-color] duration-(--duration-fast) ease-(--ease-mise)",
        MARK_CLASS[variant][axis],
        MARK_REVEAL_CLASS[variant],
      )}
    />
  )
}

type ResizableHandleProps = Omit<React.ComponentProps<"div">, "children"> & {
  variant: ResizableVariant
  horizontal: boolean
  label: string
  /** The pane this handle resizes. */
  controls: string
  value: number
  min: number
  max: number
  dragging: boolean
  disabled: boolean
}

function ResizableHandle({
  variant,
  horizontal,
  label,
  controls,
  value,
  min,
  max,
  dragging,
  disabled,
  ...handlers
}: ResizableHandleProps) {
  const axis: HandleAxis = horizontal ? "x" : "y"
  return (
    <div
      role="separator"
      tabIndex={disabled ? undefined : 0}
      aria-label={label}
      aria-orientation={horizontal ? "vertical" : "horizontal"}
      aria-controls={controls}
      aria-valuenow={Math.round(value)}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-disabled={disabled || undefined}
      data-slot="resizable-handle"
      data-variant={variant}
      data-dragging={dragging}
      className={cn(
        "group/handle relative z-10 flex shrink-0 touch-none items-center justify-center outline-none select-none",
        "transition-colors duration-(--duration-fast) ease-(--ease-mise)",
        "after:absolute focus-visible:ring-[3px] focus-visible:ring-ring/50",
        HANDLE_AXIS_CLASS[axis],
        HANDLE_CLASS[variant][axis],
        variant === "line" && LINE_ACTIVE_CLASS,
        disabled && "pointer-events-none opacity-50",
      )}
      {...handlers}
    >
      <HandleMark variant={variant} axis={axis} />
    </div>
  )
}

export { ResizableHandle, type ResizableVariant }
