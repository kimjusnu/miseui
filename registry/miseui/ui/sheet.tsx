import { useEffect, useId, useRef, useState } from "react"
import type * as React from "react"
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react"
import { SPRING_DEFAULT, SPRING_MOMENTUM, projectMomentum } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

/** Past this share of the sheet's height, the projected rest point means "let go". */
const DISMISS_FRACTION = 0.5
/** A flick faster than this dismisses regardless of distance; it is clearly a throw. */
const DISMISS_VELOCITY_PX_PER_S = 1200
/** Resistance above the open position (rubber-band) and freedom below it. */
const DRAG_ELASTIC = { top: 0.08, bottom: 1 }
const SCRIM_OPACITY = 0.32

type SheetRest = "open" | "closed"

interface SheetGesture {
  /** Drag offset from the open position in px; positive is downward. */
  offset: number
  /** Release velocity in px/s; positive is downward. */
  velocity: number
  /** Rendered sheet height in px. */
  height: number
}

/**
 * Where the sheet should come to rest after a release. Momentum is projected
 * first (Apple's decay), so a flick lands where the finger was going, not where it let go.
 */
export function resolveSheetRest({ offset, velocity, height }: SheetGesture): SheetRest {
  if (velocity < 0) return "open"
  if (velocity > DISMISS_VELOCITY_PX_PER_S) return "closed"
  const projected = offset + projectMomentum(velocity)
  return projected > height * DISMISS_FRACTION ? "closed" : "open"
}

interface SheetProps extends Omit<React.ComponentProps<typeof motion.div>, "title" | "children"> {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
}

function Sheet({ open, onOpenChange, title, className, children, ...props }: SheetProps) {
  const reduceMotion = useReducedMotion()
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  /** True from a drag release until the exit finishes, so only a thrown sheet gets the bouncier spring. */
  const [releasedWithMomentum, setReleasedWithMomentum] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onOpenChange])

  const onDragEnd = (_event: unknown, info: PanInfo) => {
    const height = panelRef.current?.offsetHeight ?? 0
    const rest = resolveSheetRest({ offset: info.offset.y, velocity: info.velocity.y, height })
    setReleasedWithMomentum(true)
    if (rest === "closed") onOpenChange(false)
  }

  const hidden = reduceMotion ? { opacity: 0 } : { y: "100%" }
  const visible = reduceMotion ? { opacity: 1 } : { y: 0 }
  const transition = releasedWithMomentum ? SPRING_MOMENTUM : SPRING_DEFAULT

  return (
    <AnimatePresence onExitComplete={() => setReleasedWithMomentum(false)}>
      {open && (
        <>
          <motion.div
            data-testid="sheet-scrim"
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: SCRIM_OPACITY }}
            exit={{ opacity: 0 }}
            transition={SPRING_DEFAULT}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            data-slot="sheet"
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-3xl bg-background p-6 pb-10 shadow-[0_-12px_40px_-16px_rgb(0_0_0/0.35)]",
              "touch-none",
              className,
            )}
            initial={hidden}
            animate={visible}
            exit={hidden}
            transition={transition}
            drag={reduceMotion ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={DRAG_ELASTIC}
            dragSnapToOrigin
            onDragEnd={onDragEnd}
            {...props}
          >
            <div aria-hidden="true" className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
            <h2 id={titleId} className="text-title text-xl">
              {title}
            </h2>
            <div className="mt-3">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export { Sheet, type SheetProps }
