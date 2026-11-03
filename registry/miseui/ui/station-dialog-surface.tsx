import type * as React from "react"
import { useCallback, useState } from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { motion, useReducedMotion, type TargetAndTransition } from "motion/react"
import { X } from "lucide-react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { useStationDialog, type StationDialogVariant } from "@/registry/miseui/ui/station-dialog-context"
import { morphOffset, pinPosition, type OriginBox } from "@/registry/miseui/ui/station-dialog-geometry"
import { cn } from "@/registry/miseui/lib/utils"

const SURFACE_CLASS: Record<StationDialogVariant, string> = {
  card: "pointer-events-auto grid max-h-[86svh] w-full max-w-md overflow-y-auto overscroll-contain rounded-xl border bg-background shadow-xl",
  side: "pointer-events-auto fixed inset-y-0 right-0 grid w-[min(24rem,calc(100%-2rem))] content-start overflow-y-auto overscroll-contain border-l bg-background shadow-xl",
  pin: "pointer-events-auto fixed grid max-h-[60svh] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-lg border bg-popover text-popover-foreground shadow-lg",
}

const MORPH_START_SCALE = 0.2
const PIN_MORPH_START_SCALE = 0.6
const PLAIN_START_SCALE = 0.96

function hiddenPose(variant: StationDialogVariant, morph: boolean, reduceMotion: boolean, box: OriginBox | null): TargetAndTransition {
  if (reduceMotion) return { opacity: 0 }
  if (variant === "side") return { x: "100%", opacity: 1 }
  if (morph && box && variant === "card") {
    return { ...morphOffset(box, { width: window.innerWidth, height: window.innerHeight }), scale: MORPH_START_SCALE, opacity: 0 }
  }
  return { scale: morph ? PIN_MORPH_START_SCALE : PLAIN_START_SCALE, opacity: 0 }
}

export type StationDialogContentProps = Omit<React.ComponentProps<typeof DialogPrimitive.Content>, "title" | "asChild" | "forceMount"> & {
  title: React.ReactNode
  /** A short line above the title, such as the line and time. */
  meta?: React.ReactNode
  closeLabel?: string
}

function usePinPlacement(variant: StationDialogVariant, box: OriginBox | null) {
  // A callback ref because the portal mounts after the first layout effect. Written to the style directly so there is no frame in the wrong place.
  return useCallback(
    (element: HTMLElement | null) => {
      if (!element || variant !== "pin" || !box) return
      const size = { width: element.offsetWidth, height: element.offsetHeight }
      const place = pinPosition(box, size, { width: window.innerWidth, height: window.innerHeight })
      element.style.left = `${place.left}px`
      element.style.top = `${place.top}px`
      element.style.transformOrigin = `${place.originX}px ${place.originY}px`
    },
    [box, variant],
  )
}

function StationHeader({ title, meta, closeLabel, compact }: { title: React.ReactNode; meta: React.ReactNode; closeLabel: string; compact: boolean }) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="grid min-w-0 gap-1">
        {meta ? <p className="text-[13px] text-muted-foreground">{meta}</p> : null}
        <DialogPrimitive.Title className={cn("font-semibold tracking-tight text-balance", compact ? "text-[15px]" : "text-xl")}>
          {title}
        </DialogPrimitive.Title>
      </div>
      <DialogPrimitive.Close
        aria-label={closeLabel}
        className="-mt-2 -mr-2 inline-grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <X aria-hidden="true" className="size-4" />
      </DialogPrimitive.Close>
    </header>
  )
}

export function StationSurface({ title, meta, closeLabel = "Close", className, children, onCloseAutoFocus, ...props }: StationDialogContentProps) {
  const { variant, effect, origin } = useStationDialog()
  const reduceMotion = useReducedMotion() ?? false
  // Read once when the surface mounts: this is where it opened from, even if the page moves underneath it later.
  const [box] = useState<OriginBox | null>(() => origin?.getBoundingClientRect() ?? null)
  const hidden = hiddenPose(variant, effect === "morph", reduceMotion, box)
  const placePin = usePinPlacement(variant, box)
  const compact = variant === "pin"
  return (
    <DialogPrimitive.Content
      forceMount
      asChild
      aria-describedby={undefined}
      onCloseAutoFocus={(event) => {
        onCloseAutoFocus?.(event)
        if (event.defaultPrevented) return
        // These triggers are not Radix triggers, so Radix does not know where to send focus back.
        event.preventDefault()
        if (origin?.isConnected) origin.focus()
      }}
      {...props}
    >
      <motion.div
        ref={placePin}
        data-slot="station-dialog"
        data-variant={variant}
        data-effect={effect}
        className={cn(SURFACE_CLASS[variant], className)}
        initial={hidden}
        animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
        exit={hidden}
        transition={SPRING_DEFAULT}
      >
        <div className={cn("grid min-w-0", compact ? "gap-2 p-4" : "gap-4 p-6")}>
          <StationHeader title={title} meta={meta} closeLabel={closeLabel} compact={compact} />
          <div className="min-w-0 text-sm leading-relaxed">{children}</div>
        </div>
      </motion.div>
    </DialogPrimitive.Content>
  )
}
