import type * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { placePopover, type TourPlacement, type TourSize } from "@/registry/miseui/ui/tour-math"
import { StepCopy, StepFooter, TourChecklist, TourHighlight, type TourLabels } from "@/registry/miseui/ui/tour-parts"
import { useTour, type TourStep } from "@/registry/miseui/ui/tour-state"
import { cn } from "@/registry/miseui/lib/utils"

type TourVariant = "spotlight" | "popover" | "banner" | "checklist"
type TourEffect = "spring"

const INSTANT = { duration: 0 } as const
const DEFAULT_LABELS: TourLabels = { next: "Next", back: "Back", finish: "Done", close: "Close tour" }

const SURFACE_CLASS = "z-50 grid gap-3 rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg outline-none"
const LAYOUT_CLASS: Record<TourVariant, string> = {
  spotlight: "fixed top-0 left-0 w-[min(20rem,calc(100vw-1rem))]",
  popover: "fixed top-0 left-0 w-[min(20rem,calc(100vw-1rem))]",
  banner: "fixed inset-x-0 bottom-4 mx-auto w-[min(36rem,calc(100vw-2rem))]",
  checklist: "fixed right-4 bottom-4 max-h-[calc(100dvh-2rem)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto",
}

type TourProps = {
  steps: readonly TourStep[]
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Where to begin. Steps whose target is missing are skipped. */
  defaultStep?: number
  onStepChange?: (index: number) => void
  /** The last step was completed, as opposed to the tour being closed early. */
  onFinish?: () => void
  /** `spotlight` dims all but the target, `popover` points without dimming, `banner` a bar along the bottom, `checklist` a corner card of all the steps. */
  variant?: TourVariant
  /** `spring` carries the highlight and the card to each new target. */
  effect?: TourEffect
  /** Air around the target, in px. */
  padding?: number
  /** Title of `checklist`. */
  title?: React.ReactNode
  labels?: Partial<TourLabels>
  className?: string
}

/** Takes the element itself, not a ref: the portal mounts the card after the first layout effect has already run. */
function useElementSize(element: HTMLElement | null): TourSize {
  const [size, setSize] = useState<TourSize>({ width: 0, height: 0 })
  useLayoutEffect(() => {
    if (!element) return undefined
    const measure = () => setSize({ width: element.offsetWidth, height: element.offsetHeight })
    measure()
    if (typeof ResizeObserver === "undefined") return undefined
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])
  return size
}

/** True from the second frame. A card still finding its size must appear in place, not slide there. */
function useSettled() {
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setSettled(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  return settled
}

/** Radix returns focus to a trigger, and a tour has none: it starts from anything, so it remembers for itself. */
function useReturnFocus(primaryRef: React.RefObject<HTMLButtonElement | null>) {
  const returnTo = useRef<HTMLElement | null>(null)
  return {
    onOpenAutoFocus: (event: Event) => {
      returnTo.current = document.activeElement as HTMLElement | null
      event.preventDefault()
      primaryRef.current?.focus({ preventScroll: true })
    },
    onCloseAutoFocus: (event: Event) => {
      event.preventDefault()
      returnTo.current?.focus({ preventScroll: true })
    },
  }
}

function arrowKeys(goNext: () => void, goBack: () => void) {
  return (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return
    event.preventDefault()
    if (event.key === "ArrowRight") goNext()
    else goBack()
  }
}

function useCardMotion(
  card: HTMLElement | null,
  geometry: ReturnType<typeof useTour>["geometry"],
  placement: TourPlacement | undefined,
  effect: TourEffect | undefined,
) {
  const reduceMotion = useReducedMotion() ?? false
  const settled = useSettled()
  const popover = useElementSize(card)
  return {
    spot: placePopover({ target: geometry.rect, popover, viewport: geometry.viewport, placement }),
    transition: effect === "spring" && !reduceMotion && settled && geometry.moving ? SPRING_DEFAULT : INSTANT,
  }
}

interface SessionProps extends Required<Pick<TourProps, "steps" | "variant" | "padding">>, Pick<TourProps, "effect" | "title" | "onStepChange" | "onFinish" | "className"> {
  initialStep: number
  labels: TourLabels
  onClose: () => void
}

function TourSession({ steps, variant, padding, effect, title, initialStep, labels, onStepChange, onFinish, className, onClose }: SessionProps) {
  const { step, index, position, shown, geometry, isLast, hasPrevious, done, goNext, goBack, goTo } = useTour({ steps, initialStep, padding, onStepChange, onFinish, onClose })
  const [card, setCard] = useState<HTMLDivElement | null>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)
  const focus = useReturnFocus(primaryRef)
  const { spot, transition } = useCardMotion(card, geometry, step?.placement, effect)
  const anchored = variant === "spotlight" || variant === "popover"

  // Stays on the main action, since Back disappears on the first step and would otherwise drop focus to the page.
  useEffect(() => {
    primaryRef.current?.focus({ preventScroll: true })
  }, [index])

  if (!step) return null
  const footer = { position, total: shown.length, isLast, labels, primaryRef, onBack: goBack, onNext: goNext }
  return (
    <DialogPrimitive.Portal>
      <TourHighlight rect={geometry.rect} dim={variant === "spotlight"} transition={transition} />
      <DialogPrimitive.Content
        asChild
        // Without a body there is no description element, and the default id would point at nothing.
        {...(step.body ? {} : { "aria-describedby": undefined })}
        {...focus}
        // A tour is left on purpose, with Close or Escape. A stray click on the page must not lose someone's place.
        onInteractOutside={(event) => event.preventDefault()}
        onKeyDown={arrowKeys(goNext, goBack)}
      >
        <motion.div
          ref={setCard}
          data-slot="tour"
          data-variant={variant}
          data-effect={effect}
          data-side={anchored ? spot.side ?? undefined : undefined}
          initial={false}
          animate={anchored ? { x: spot.x, y: spot.y } : undefined}
          transition={transition}
          className={cn(SURFACE_CLASS, LAYOUT_CLASS[variant], className)}
        >
          {variant === "checklist" ? (
            <TourChecklist {...footer} title={title} steps={steps} shown={shown} index={index} done={done} onJump={goTo} />
          ) : (
            <>
              <StepCopy step={step} closeLabel={labels.close} />
              <StepFooter {...footer} hasPrevious={hasPrevious} />
            </>
          )}
          <span role="status" className="sr-only">{`Step ${position} of ${shown.length}`}</span>
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

function Tour({ open: openProp, defaultOpen = false, onOpenChange, defaultStep = 0, variant = "spotlight", padding = 8, title = "Getting started", labels, ...rest }: TourProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen)
  const open = openProp ?? uncontrolled
  const setOpen = (next: boolean) => {
    setUncontrolled(next)
    onOpenChange?.(next)
  }
  return (
    // Only the spotlight is modal: the others explain the page while leaving it usable.
    <DialogPrimitive.Root open={open} onOpenChange={setOpen} modal={variant === "spotlight"}>
      {open ? <TourSession {...rest} {...{ variant, padding, title }} initialStep={defaultStep} labels={{ ...DEFAULT_LABELS, ...labels }} onClose={() => setOpen(false)} /> : null}
    </DialogPrimitive.Root>
  )
}

export { Tour, type TourProps, type TourStep, type TourVariant, type TourEffect, type TourLabels, type TourPlacement }
