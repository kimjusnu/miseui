import type * as React from "react"
import { useId } from "react"
import { motion, type MotionStyle, type MotionValue } from "motion/react"
import { ResizableHandle, type ResizableVariant } from "@/registry/miseui/ui/resizable-handle"
import { FULL } from "@/registry/miseui/ui/resizable-math"
import { useResizeControl, type ResizableDirection } from "@/registry/miseui/ui/resizable-state"
import { cn } from "@/registry/miseui/lib/utils"

type ResizableEffect = "snap"

const DEFAULT_SIZE = 50
const DEFAULT_MIN = 10
const DEFAULT_MAX = 90
const DEFAULT_STEP = 5

/** Space the handle takes in the row, in px; the first pane's share is worked out from what remains. */
const HANDLE_PX: Record<ResizableVariant, number> = { line: 1, grip: 12, gap: 8, hidden: 0 }

const ROOT_CLASS: Record<ResizableVariant, string> = {
  line: "overflow-hidden rounded-lg border",
  grip: "overflow-hidden rounded-lg border",
  gap: "",
  hidden: "overflow-hidden rounded-lg",
}

const PANEL_CLASS: Record<ResizableVariant, string> = {
  line: "",
  grip: "",
  gap: "rounded-lg border bg-card data-[collapsed=true]:border-0",
  hidden: "",
}

type ResizableProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Exactly two panes. Nest another Resizable inside one for a third. */
  children: readonly [React.ReactNode, React.ReactNode]
  /** `line` a hairline, `grip` a bar with a visible handle, `gap` two cards apart, `hidden` nothing until hovered. */
  variant?: ResizableVariant
  /** `snap` lets a flick collapse a pane, judged by where the momentum would carry it. */
  effect?: ResizableEffect
  direction?: ResizableDirection
  /** Share of the first pane, in percent. Hands the size to you. */
  size?: number
  /** Also what a double-click on the handle goes back to. */
  defaultSize?: number
  min?: number
  max?: number
  /** Percent moved by one arrow key. */
  step?: number
  disabled?: boolean
  /** Name of the handle for assistive tech. */
  handleLabel?: string
  onSizeChange?: (size: number) => void
}

function firstPaneStyle(live: MotionValue<number>, handlePx: number) {
  // clamp: the momentum spring may overshoot a collapse, and a pane cannot be narrower than nothing.
  return {
    "--resizable-size": live,
    flexBasis: `calc((100% - ${handlePx}px) * clamp(0, var(--resizable-size), ${FULL}) / ${FULL})`,
  } as MotionStyle
}

interface ResizablePaneProps {
  variant: ResizableVariant
  collapsed: boolean
  id?: string
  /** Only the first pane has a size of its own; the second takes what is left. */
  style?: MotionStyle
  children: React.ReactNode
}

function ResizablePane({ variant, collapsed, id, style, children }: ResizablePaneProps) {
  return (
    <motion.div
      id={id}
      data-slot="resizable-panel"
      data-collapsed={collapsed}
      inert={collapsed}
      className={cn("min-h-0 min-w-0 overflow-auto", style ? "shrink-0 grow-0" : "flex-1", PANEL_CLASS[variant])}
      style={style}
    >
      {children}
    </motion.div>
  )
}

function Resizable({
  children,
  variant = "line",
  effect,
  direction = "horizontal",
  size,
  defaultSize = DEFAULT_SIZE,
  min = DEFAULT_MIN,
  max = DEFAULT_MAX,
  step = DEFAULT_STEP,
  disabled = false,
  handleLabel = "Resize panels",
  onSizeChange,
  className,
  ...props
}: ResizableProps) {
  const firstId = useId()
  const collapsible = effect === "snap"
  const handlePx = HANDLE_PX[variant]
  const options = { direction, size, defaultSize, limits: { min, max }, step, collapsible, disabled, handlePx, onSizeChange }
  const { current, live, dragging, handlers } = useResizeControl(options)
  const horizontal = direction === "horizontal"
  return (
    <div
      data-slot="resizable"
      data-variant={variant}
      data-effect={effect}
      data-direction={direction}
      data-dragging={dragging || undefined}
      className={cn("flex min-h-0 min-w-0", horizontal ? "flex-row" : "flex-col", dragging && "select-none", ROOT_CLASS[variant], className)}
      {...props}
    >
      <ResizablePane id={firstId} variant={variant} collapsed={current <= 0} style={firstPaneStyle(live, handlePx)}>
        {children[0]}
      </ResizablePane>
      <ResizableHandle
        {...{ variant, horizontal, dragging, disabled }}
        {...{ label: handleLabel, controls: firstId, value: current }}
        // A pane that can collapse really does reach 0 and 100, whatever the drag limits are.
        min={collapsible ? 0 : min}
        max={collapsible ? FULL : max}
        {...handlers}
      />
      <ResizablePane variant={variant} collapsed={current >= FULL}>
        {children[1]}
      </ResizablePane>
    </div>
  )
}

export { Resizable, type ResizableProps, type ResizableVariant, type ResizableEffect, type ResizableDirection }
