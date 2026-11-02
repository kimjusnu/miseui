import type * as React from "react"
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { motion, useDragControls, useReducedMotion, type PanInfo } from "motion/react"
import { X } from "lucide-react"
import { resolveSheetRest } from "@/registry/miseui/ui/sheet"
import {
  SHEET_SURFACE_CLASS,
  drawerContentClass,
  drawerScrimClass,
  type DrawerEffect,
  type DrawerSide,
  type DrawerVariant,
} from "@/registry/miseui/ui/drawer-classes"
import {
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/registry/miseui/ui/drawer-parts"
import { cn } from "@/registry/miseui/lib/utils"

interface DrawerContextValue {
  variant: DrawerVariant
  side: DrawerSide
  effect: DrawerEffect | undefined
  setOpen: (open: boolean) => void
}

const DrawerContext = createContext<DrawerContextValue>({
  variant: "plain",
  side: "right",
  effect: undefined,
  setOpen: () => {},
})

/** Same resistance as Sheet: firm above the open position, free below it. */
const SHEET_DRAG_ELASTIC = { top: 0.08, bottom: 1 }

type DrawerProps = Omit<React.ComponentProps<typeof DialogPrimitive.Root>, "modal"> & {
  /** `plain` full height at the edge, `floating` inset with radius, `split` no scrim so the page stays usable, `sheet` bottom with a grab handle. */
  variant?: DrawerVariant
  /** `sheet` always uses the bottom edge. */
  side?: DrawerSide
  /** `push` brings the panel into focus while the page recedes behind a deep blur. */
  effect?: DrawerEffect
}

function Drawer({
  variant = "plain",
  side = "right",
  effect,
  open,
  defaultOpen = false,
  onOpenChange,
  ...props
}: DrawerProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen)
  const current = open ?? uncontrolled
  const setOpen = useCallback(
    (next: boolean) => {
      setUncontrolled(next)
      onOpenChange?.(next)
    },
    [onOpenChange],
  )
  const resolvedSide = variant === "sheet" ? "bottom" : side
  const context = useMemo(
    () => ({ variant, side: resolvedSide, effect, setOpen }),
    [variant, resolvedSide, effect, setOpen],
  )
  return (
    <DrawerContext.Provider value={context}>
      {/* A modal dialog would trap focus and hide the page from assistive tech, the opposite of what split is for. */}
      <DialogPrimitive.Root open={current} onOpenChange={setOpen} modal={variant !== "split"} {...props} />
    </DrawerContext.Provider>
  )
}

function DrawerTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerCornerClose() {
  return (
    <DialogPrimitive.Close
      data-slot="drawer-close"
      className={cn(
        "absolute top-2 right-2 inline-flex size-10 items-center justify-center rounded-md text-muted-foreground outline-none",
        "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent hover:text-accent-foreground",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50",
      )}
    >
      <X aria-hidden="true" className="size-4" />
      <span className="sr-only">Close</span>
    </DialogPrimitive.Close>
  )
}

function SheetSurface({ className, children }: { className?: string; children: React.ReactNode }) {
  const { setOpen } = useContext(DrawerContext)
  const reduceMotion = useReducedMotion()
  const dragControls = useDragControls()
  const surfaceRef = useRef<HTMLDivElement>(null)
  const onDragEnd = (_event: unknown, info: PanInfo) => {
    const height = surfaceRef.current?.offsetHeight ?? 0
    if (resolveSheetRest({ offset: info.offset.y, velocity: info.velocity.y, height }) === "closed") setOpen(false)
  }
  return (
    <motion.div
      ref={surfaceRef}
      className={cn("relative", SHEET_SURFACE_CLASS, className)}
      drag={reduceMotion ? false : "y"}
      dragControls={dragControls}
      // Only the handle starts a drag, so text in the sheet can still be selected and scrolled.
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={SHEET_DRAG_ELASTIC}
      dragSnapToOrigin
      onDragEnd={onDragEnd}
    >
      <div
        aria-hidden="true"
        data-slot="drawer-handle"
        className="flex h-10 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
        onPointerDown={(event) => dragControls.start(event)}
      >
        <span className="h-1 w-10 rounded-full bg-muted-foreground/30" />
      </div>
      {children}
    </motion.div>
  )
}

type DrawerContentProps = React.ComponentProps<typeof DialogPrimitive.Content> & {
  /** Keep this on `split`, where a click outside does not close the panel. */
  showCloseButton?: boolean
}

function DrawerContent({ className, children, showCloseButton = true, onInteractOutside, ...props }: DrawerContentProps) {
  const { variant, side, effect } = useContext(DrawerContext)
  const isSplit = variant === "split"
  const isSheet = variant === "sheet"
  const inner = (
    <>
      {children}
      {showCloseButton && <DrawerCornerClose />}
    </>
  )
  return (
    <DialogPrimitive.Portal>
      {!isSplit && <DialogPrimitive.Overlay data-slot="drawer-overlay" className={drawerScrimClass(effect)} />}
      <DialogPrimitive.Content
        data-slot="drawer"
        data-variant={variant}
        data-side={side}
        data-effect={effect}
        className={cn(drawerContentClass(variant, side, effect), !isSheet && className)}
        // In split the page beside the panel is the point, so working there must not dismiss it.
        onInteractOutside={isSplit ? (event) => event.preventDefault() : onInteractOutside}
        {...props}
      >
        {isSheet ? <SheetSurface className={className}>{inner}</SheetSurface> : inner}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  type DrawerProps,
  type DrawerContentProps,
  type DrawerEffect,
  type DrawerSide,
  type DrawerVariant,
}
