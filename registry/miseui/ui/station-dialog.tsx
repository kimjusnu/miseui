import type * as React from "react"
import { useCallback, useMemo, useState } from "react"
import { Dialog as DialogPrimitive, Slot } from "radix-ui"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import {
  StationDialogContext,
  useStationDialog,
  type StationDialogEffect,
  type StationDialogVariant,
} from "@/registry/miseui/ui/station-dialog-context"
import { StationSurface, type StationDialogContentProps } from "@/registry/miseui/ui/station-dialog-surface"
import { cn } from "@/registry/miseui/lib/utils"

interface StationDialogProps {
  /** The open station, or null when closed. Several triggers can share one dialog. */
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string | null) => void
  /** Where it opened from when no StationDialogTrigger was pressed, such as a point on a map you draw yourself. */
  origin?: HTMLElement | null
  /** `card` a centred surface, `side` a panel that leaves the map in view, `pin` a small note beside the point itself. */
  variant?: StationDialogVariant
  /** `morph` grows the surface out of the point it opened from and shrinks it back there. */
  effect?: StationDialogEffect
  children?: React.ReactNode
}

function StationDialog({ value, defaultValue = null, onValueChange, origin, variant = "card", effect, children }: StationDialogProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const [pressed, setPressed] = useState<HTMLElement | null>(null)
  const current = value === undefined ? uncontrolled : value
  const choose = useCallback(
    (next: string | null, element?: HTMLElement) => {
      if (element) setPressed(element)
      setUncontrolled(next)
      onValueChange?.(next)
    },
    [onValueChange],
  )
  const context = useMemo(
    () => ({ value: current, variant, effect, origin: origin ?? pressed, choose }),
    [current, variant, effect, origin, pressed, choose],
  )
  return (
    <StationDialogContext.Provider value={context}>
      <DialogPrimitive.Root open={current !== null} onOpenChange={(open) => (open ? undefined : choose(null))}>
        {children}
      </DialogPrimitive.Root>
    </StationDialogContext.Provider>
  )
}

type StationDialogTriggerProps = React.ComponentProps<"button"> & { value: string; asChild?: boolean }

function StationDialogTrigger({ value, asChild = false, onClick, ...props }: StationDialogTriggerProps) {
  const { value: current, choose } = useStationDialog()
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="station-dialog-trigger"
      type={asChild ? undefined : "button"}
      aria-haspopup="dialog"
      aria-expanded={current === value}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (!event.defaultPrevented) choose(value, event.currentTarget)
      }}
      {...props}
    />
  )
}

const OVERLAY_CLASS: Record<StationDialogVariant, string> = {
  card: "bg-background/70 backdrop-blur-sm [@media(prefers-reduced-transparency:reduce)]:bg-background/90 [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none",
  side: "bg-background/40",
  // The map is the point of a pin, so nothing covers it; the layer is still there to catch the click that closes it.
  pin: "bg-transparent",
}

function StationDialogContent(props: StationDialogContentProps) {
  const { value, variant } = useStationDialog()
  const reduceMotion = useReducedMotion() ?? false
  return (
    <AnimatePresence>
      {value !== null ? (
        <DialogPrimitive.Portal forceMount key="station-dialog">
          <DialogPrimitive.Overlay forceMount asChild>
            <motion.div
              data-slot="station-dialog-overlay"
              className={cn("fixed inset-0 z-50", OVERLAY_CLASS[variant])}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={reduceMotion ? { duration: 0 } : SPRING_DEFAULT}
            />
          </DialogPrimitive.Overlay>
          {/* A full-screen grid centres a surface of any height, which also gives morph a known place to travel to. */}
          <div className={cn("pointer-events-none fixed inset-0 z-50", variant === "card" && "grid place-items-center p-4")}>
            <StationSurface {...props} />
          </div>
        </DialogPrimitive.Portal>
      ) : null}
    </AnimatePresence>
  )
}

export {
  StationDialog,
  StationDialogTrigger,
  StationDialogContent,
  type StationDialogProps,
  type StationDialogTriggerProps,
  type StationDialogContentProps,
  type StationDialogVariant,
  type StationDialogEffect,
}
