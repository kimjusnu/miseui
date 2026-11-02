import { GripHorizontal, Minus, Plus, X } from "lucide-react"
import type { PanelGestures } from "@/registry/miseui/ui/floating-panel-gestures"
import type { DockSide } from "@/registry/miseui/ui/floating-panel-math"
import { cn } from "@/registry/miseui/lib/utils"

type FloatingPanelVariant = "panel" | "compact" | "docked" | "tool"

interface FloatingPanelLabels {
  move: (title: string) => string
  resize: (title: string) => string
  minimize: string
  restore: string
  close: string
  /** How to use the handles with a keyboard, read out once. */
  hint: string
}

const BUTTON_CLASS = cn(
  "flex shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none pointer-coarse:size-10",
  "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent hover:text-foreground",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4",
)

const HEADER_CLASS: Record<FloatingPanelVariant, string> = {
  panel: "min-h-10 gap-2 border-b px-3 py-1",
  compact: "min-h-8 gap-1 border-b px-2 pointer-coarse:min-h-10",
  docked: "min-h-12 gap-2 border-b px-4 py-1",
  tool: "min-h-6 justify-center px-1 pointer-coarse:min-h-10",
}

interface PanelHeaderProps {
  variant: FloatingPanelVariant
  title: string
  titleId: string
  hintId: string
  minimized: boolean
  closable: boolean
  labels: FloatingPanelLabels
  gestures: PanelGestures
  onToggleMinimize: () => void
  onClose: () => void
}

function PanelHeader({ variant, title, titleId, hintId, minimized, closable, labels, gestures, onToggleMinimize, onClose }: PanelHeaderProps) {
  const tool = variant === "tool"
  const buttonSize = variant === "compact" || tool ? "size-6" : "size-8"
  return (
    <div data-slot="floating-panel-header" className={cn("flex items-center", HEADER_CLASS[variant])}>
      <div
        role="button"
        tabIndex={0}
        aria-label={labels.move(title)}
        aria-describedby={hintId}
        aria-roledescription="move handle"
        data-slot="floating-panel-handle"
        className={cn(
          "flex min-h-6 min-w-0 flex-1 cursor-grab touch-none items-center self-stretch rounded-sm outline-none select-none active:cursor-grabbing",
          "focus-visible:ring-[3px] focus-visible:ring-ring/50",
          tool && "justify-center text-muted-foreground",
        )}
        onPointerDown={gestures.onMoveStart}
        onPointerMove={gestures.onMove}
        onPointerUp={gestures.onMoveEnd}
        onPointerCancel={gestures.onMoveEnd}
        onKeyDown={gestures.onMoveKeyDown}
      >
        {tool ? (
          <GripHorizontal aria-hidden="true" className="size-4" />
        ) : (
          <span id={titleId} className={cn("truncate font-medium", variant === "compact" ? "text-[13px]" : "text-sm")}>{title}</span>
        )}
      </div>
      {tool ? <span id={titleId} className="sr-only">{title}</span> : null}
      <button
        type="button"
        aria-label={minimized ? labels.restore : labels.minimize}
        aria-expanded={!minimized}
        className={cn(BUTTON_CLASS, buttonSize)}
        onClick={onToggleMinimize}
      >
        {minimized ? <Plus aria-hidden="true" /> : <Minus aria-hidden="true" />}
      </button>
      {closable ? (
        <button type="button" aria-label={labels.close} className={cn(BUTTON_CLASS, buttonSize)} onClick={onClose}>
          <X aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}

interface ResizeHandleProps {
  variant: FloatingPanelVariant
  title: string
  hintId: string
  labels: FloatingPanelLabels
  side: DockSide
  gestures: PanelGestures
}

/** A panel corner everywhere except the dock, which is full height and only has an inner edge to pull. */
function ResizeHandle({ variant, title, hintId, labels, side, gestures }: ResizeHandleProps) {
  const docked = variant === "docked"
  const edge = side === "right" ? "left-0" : "right-0"
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={labels.resize(title)}
      aria-describedby={hintId}
      aria-roledescription="resize handle"
      data-slot="floating-panel-resize"
      className={cn(
        "absolute touch-none outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset",
        docked
          ? cn("inset-y-0 w-2 cursor-ew-resize hover:bg-accent pointer-coarse:w-4", edge)
          : "right-0 bottom-0 flex size-4 cursor-nwse-resize items-end justify-end rounded-br-lg p-1 pointer-coarse:size-10",
      )}
      onPointerDown={gestures.begin}
      onPointerMove={gestures.onResize}
      onPointerUp={gestures.onResizeEnd}
      onPointerCancel={gestures.onResizeEnd}
      onKeyDown={gestures.onResizeKeyDown}
    >
      {docked ? null : <span aria-hidden="true" className="size-2 rounded-br-sm border-r-2 border-b-2 border-muted-foreground/50" />}
    </div>
  )
}

/** Each look is its own surface; `docked` loses the rounding on the side that meets the edge. */
function surfaceClass(variant: FloatingPanelVariant, side: DockSide) {
  const shared = "border bg-popover text-popover-foreground"
  if (variant === "docked") return cn(shared, "shadow-md", side === "right" ? "rounded-l-lg border-r-0" : "rounded-r-lg border-l-0")
  if (variant === "compact") return cn(shared, "rounded-md shadow-md")
  if (variant === "tool") return cn(shared, "w-fit rounded-xl shadow-lg")
  return cn(shared, "rounded-lg shadow-lg")
}

export { PanelHeader, ResizeHandle, surfaceClass, type FloatingPanelLabels, type FloatingPanelVariant }
