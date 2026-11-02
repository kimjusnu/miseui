import type * as React from "react"
import { useId, useRef } from "react"
import { Portal } from "radix-ui"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import type { DockSide, PanelPoint, PanelSize } from "@/registry/miseui/ui/floating-panel-math"
import {
  PanelHeader,
  ResizeHandle,
  surfaceClass,
  type FloatingPanelLabels,
  type FloatingPanelVariant,
} from "@/registry/miseui/ui/floating-panel-parts"
import { usePanelGestures } from "@/registry/miseui/ui/floating-panel-gestures"
import { useControllable, useFitWhenShown, usePanelDismiss, usePanelGeometry, type PanelGeometry } from "@/registry/miseui/ui/floating-panel-state"
import { cn } from "@/registry/miseui/lib/utils"

type FloatingPanelEffect = "momentum"

const INSTANT = { duration: 0 } as const
const DEFAULT_MIN_SIZE: PanelSize = { width: 160, height: 96 }
const DEFAULT_SIZE: Record<FloatingPanelVariant, PanelSize> = {
  panel: { width: 288, height: 240 },
  compact: { width: 216, height: 160 },
  docked: { width: 240, height: 240 },
  tool: { width: 48, height: 208 },
}
const DEFAULT_LABELS: FloatingPanelLabels = {
  move: (title) => `Move ${title}`,
  resize: (title) => `Resize ${title}`,
  minimize: "Minimise",
  restore: "Restore",
  close: "Close",
  hint: "Use the arrow keys. Hold Shift for larger steps.",
}

type RootAttributes = Omit<
  React.ComponentProps<"div">,
  "title" | "style" | "onKeyDown" | "onFocusCapture" | "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
>

interface FloatingPanelProps extends RootAttributes {
  /** Names the dialog. `tool` keeps it for assistive tech and shows only a grip. */
  title: string
  /** `panel` a titled window, `compact` tight chrome, `docked` snaps to the nearest side at full height, `tool` a narrow palette. */
  variant?: FloatingPanelVariant
  /** `momentum` keeps a thrown panel travelling after release, and it still stops at the edges. */
  effect?: FloatingPanelEffect
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  minimized?: boolean
  defaultMinimized?: boolean
  onMinimizedChange?: (minimized: boolean) => void
  /** The element to stay inside, which must be positioned. Without one the panel floats over the viewport through a portal. */
  boundary?: React.RefObject<HTMLElement | null>
  defaultPosition?: PanelPoint
  onPositionChange?: (position: PanelPoint) => void
  defaultSize?: PanelSize
  minSize?: PanelSize
  maxSize?: Partial<PanelSize>
  onSizeChange?: (size: PanelSize) => void
  /** On by default, except `tool`, which is as large as its contents. */
  resizable?: boolean
  /** Hides the close button and turns Escape off, for a panel that cannot go away. */
  closable?: boolean
  labels?: Partial<FloatingPanelLabels>
}

interface PanelBodyProps {
  variant: FloatingPanelVariant
  minimized: boolean
  fullHeight: boolean
  reduceMotion: boolean
  geometry: PanelGeometry
  children: React.ReactNode
}

function PanelBody({ variant, minimized, fullHeight, reduceMotion, geometry, children }: PanelBodyProps) {
  const fixedHeight = variant !== "tool" && variant !== "docked"
  return (
    <motion.div
      data-slot="floating-panel-collapse"
      inert={minimized}
      className={cn("min-h-0 overflow-hidden", fullHeight && "flex-1")}
      initial={false}
      animate={{ height: minimized ? 0 : "auto" }}
      transition={reduceMotion ? INSTANT : SPRING_DEFAULT}
      onAnimationComplete={() => geometry.fit()}
    >
      <motion.div
        data-slot="floating-panel-body"
        style={fixedHeight ? { height: geometry.height } : undefined}
        className={cn("overflow-auto", variant !== "tool" && "text-sm", variant === "docked" && "h-full")}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

function panelFrameClass(variant: FloatingPanelVariant, side: DockSide, inBoundary: boolean, fullHeight: boolean, className?: string) {
  return cn(
    inBoundary ? "absolute" : "fixed",
    "top-0 left-0 z-40 flex flex-col overflow-hidden outline-none",
    fullHeight && (inBoundary ? "h-full" : "h-dvh"),
    surfaceClass(variant, side),
    className,
  )
}

function FloatingPanel({
  title, variant = "panel", effect, open, defaultOpen = true, onOpenChange, minimized, defaultMinimized = false, onMinimizedChange,
  boundary, defaultPosition = { x: 16, y: 16 }, onPositionChange, defaultSize, minSize = DEFAULT_MIN_SIZE, maxSize, onSizeChange,
  resizable, closable = true, labels, className, children, ...props
}: FloatingPanelProps) {
  const reduceMotion = useReducedMotion() ?? false
  const titleId = useId()
  const hintId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const merged = { ...DEFAULT_LABELS, ...labels }
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange)
  const [isMinimized, setMinimized] = useControllable(minimized, defaultMinimized, onMinimizedChange)
  const docked = variant === "docked"
  const geometry = usePanelGeometry({ boundary, docked, reduceMotion, defaultPosition, defaultSize: defaultSize ?? DEFAULT_SIZE[variant], minSize, maxSize }, panelRef)
  const gestures = usePanelGestures(geometry, { docked, momentum: effect === "momentum", reduceMotion, onPositionChange, onSizeChange })
  const dismiss = usePanelDismiss(setOpen, closable)
  useFitWhenShown(isOpen, isMinimized, geometry.fit)
  const fullHeight = docked && !isMinimized
  const toggleMinimize = () => {
    if (isMinimized) geometry.settleForRestore()
    setMinimized(!isMinimized)
  }
  const panel = (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          ref={panelRef} role="dialog" aria-labelledby={titleId} data-slot="floating-panel" data-variant={variant} data-effect={effect}
          data-side={docked ? geometry.side : undefined} data-minimized={isMinimized ? "true" : undefined}
          style={{ x: geometry.x, y: geometry.y, width: variant === "tool" ? undefined : geometry.width }}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduceMotion ? { opacity: 0, transition: INSTANT } : { opacity: 0, scale: 0.98 }}
          transition={SPRING_DEFAULT}
          className={panelFrameClass(variant, geometry.side, Boolean(boundary), fullHeight, className)}
          onFocusCapture={dismiss.onFocusCapture}
          onKeyDown={dismiss.onKeyDown}
          {...props}
        >
          <span id={hintId} className="sr-only">{merged.hint}</span>
          <PanelHeader variant={variant} title={title} titleId={titleId} hintId={hintId} minimized={isMinimized} closable={closable} labels={merged} gestures={gestures} onClose={dismiss.close} onToggleMinimize={toggleMinimize} />
          <PanelBody variant={variant} minimized={isMinimized} fullHeight={fullHeight} reduceMotion={reduceMotion} geometry={geometry}>{children}</PanelBody>
          {(resizable ?? variant !== "tool") && !isMinimized ? <ResizeHandle variant={variant} title={title} hintId={hintId} labels={merged} side={geometry.side} gestures={gestures} /> : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
  return boundary ? panel : <Portal.Root>{panel}</Portal.Root>
}

export {
  FloatingPanel,
  type FloatingPanelProps,
  type FloatingPanelVariant,
  type FloatingPanelEffect,
  type FloatingPanelLabels,
}
