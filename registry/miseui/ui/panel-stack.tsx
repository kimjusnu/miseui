import type * as React from "react"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { PanelDeck, type PanelStackEffect, type PanelStackPanel, type PanelStackVariant } from "@/registry/miseui/ui/panel-stack-deck"
import { nearestPanel, wheelStep } from "@/registry/miseui/ui/panel-stack-state"

/** A whole screen moving needs longer than a popover, or it reads as a jump. */
const SLIDE_TRANSITION = { ...SPRING_DEFAULT, duration: 0.5 }
const INSTANT = { duration: 0 } as const

const BACK_CLASS =
  "flex h-8 shrink-0 items-center gap-1 rounded-md border px-2 text-[13px] outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:h-10"

type PanelStackProps = Omit<React.ComponentProps<"div">, "children"> & {
  panels: readonly PanelStackPanel[]
  /** `deck` one panel at a time in the page, `peek` the next panel shows at the edge, `overlay` the whole screen slides over the page. */
  variant?: PanelStackVariant
  /** `wheel` makes one wheel gesture turn one panel. It lets go at the first and last, so the page can move on. */
  effect?: PanelStackEffect
  /** Names the group of panels, and the dialog in `overlay`. */
  label?: string
  previousLabel?: string
  nextLabel?: string
  /** `overlay` only: the element that opens it. */
  trigger?: React.ReactNode
  /** `overlay` only. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** `overlay` only: the way back. */
  closeLabel?: string
}

interface OverlayProps extends PanelStackProps {
  words: { label: string; previousLabel: string; nextLabel: string }
}

function PanelOverlay({ panels, effect, words, trigger, open, defaultOpen = false, onOpenChange, closeLabel = "Back", className, ...rootProps }: OverlayProps) {
  const reduceMotion = useReducedMotion() ?? false
  const [uncontrolled, setUncontrolled] = useState(defaultOpen)
  const isOpen = open ?? uncontrolled
  const setOpen = (next: boolean) => {
    setUncontrolled(next)
    onOpenChange?.(next)
  }
  const hidden = reduceMotion ? { opacity: 0 } : { x: "100%" }
  const shown = reduceMotion ? { opacity: 1 } : { x: "0%" }
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      {/* AnimatePresence holds the panel for its exit, so forceMount takes that job away from Radix. */}
      <AnimatePresence>
        {isOpen ? (
          <DialogPrimitive.Portal forceMount>
            {/* Invisible, and still needed: it carries the scroll lock for the page behind. */}
            <DialogPrimitive.Overlay forceMount className="fixed inset-0 z-50" />
            <DialogPrimitive.Content forceMount asChild aria-describedby={undefined}>
              <motion.div className="fixed inset-0 z-50 bg-background text-foreground outline-none" initial={hidden} animate={shown} exit={hidden} transition={reduceMotion ? INSTANT : SLIDE_TRANSITION}>
                <DialogPrimitive.Title className="sr-only">{words.label}</DialogPrimitive.Title>
                <PanelDeck
                  {...words}
                  panels={panels}
                  variant="overlay"
                  effect={effect}
                  className={className}
                  rootProps={rootProps}
                  leading={
                    <DialogPrimitive.Close className={BACK_CLASS}>
                      {/* The screen came in from the right, so the way out points back the other way. */}
                      <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
                      {closeLabel}
                    </DialogPrimitive.Close>
                  }
                />
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        ) : null}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}

/** Meaningless on a stack in the page, and a DOM element would complain about them. */
const OVERLAY_ONLY: ReadonlySet<string> = new Set(["trigger", "open", "defaultOpen", "onOpenChange", "closeLabel"])

function PanelStack({ variant = "deck", label = "Panels", previousLabel = "Previous panel", nextLabel = "Next panel", ...props }: PanelStackProps) {
  const words = { label, previousLabel, nextLabel }
  if (variant === "overlay") return <PanelOverlay {...props} words={words} />
  const { panels, effect, className, ...rest } = props
  const rootProps = Object.fromEntries(Object.entries(rest).filter(([key]) => !OVERLAY_ONLY.has(key)))
  return <PanelDeck {...words} panels={panels} variant={variant} effect={effect} className={className} rootProps={rootProps} />
}

export { PanelStack, nearestPanel, wheelStep, type PanelStackProps, type PanelStackPanel, type PanelStackVariant, type PanelStackEffect }
