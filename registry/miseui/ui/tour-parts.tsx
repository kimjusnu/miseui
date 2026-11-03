import type * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { Check, X } from "lucide-react"
import { motion } from "motion/react"
import { Button } from "@/registry/miseui/ui/button"
import type { TourRect } from "@/registry/miseui/ui/tour-math"
import type { TourStep } from "@/registry/miseui/ui/tour-state"
import { cn } from "@/registry/miseui/lib/utils"

type MotionTransition = React.ComponentProps<typeof motion.div>["transition"]

interface TourLabels {
  next: string
  back: string
  finish: string
  close: string
}

const CUTOUT_RADIUS_PX = 8
/** Big enough to cover any screen from a spot anywhere on it. Black in both themes: a dim is a dim. */
const DIM_SHADOW = "0 0 0 1px rgb(255 255 255 / 0.2), 0 0 0 200vmax rgb(0 0 0 / 0.55)"
const BUTTON_SIZE_CLASS = "pointer-coarse:h-10"
const CLOSE_CLASS = [
  "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none pointer-coarse:size-10",
  "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
]

interface HighlightProps {
  rect: TourRect | null
  dim: boolean
  transition: MotionTransition
}

/** One box does the whole job: its shadow is the dim, so the hole in it is simply the box itself. */
function TourHighlight({ rect, dim, transition }: HighlightProps) {
  if (!rect && !dim) return null
  const box = rect ?? { x: window.innerWidth / 2, y: window.innerHeight / 2, width: 0, height: 0 }
  return (
    <motion.div
      aria-hidden="true"
      data-slot="tour-highlight"
      data-dim={dim ? "true" : undefined}
      data-rect={`${box.x},${box.y},${box.width},${box.height}`}
      initial={false}
      animate={{ x: box.x, y: box.y, width: box.width, height: box.height }}
      transition={transition}
      className={cn("pointer-events-none fixed top-0 left-0 z-50", !dim && "ring-2 ring-mise ring-offset-2 ring-offset-background")}
      style={{ borderRadius: CUTOUT_RADIUS_PX, boxShadow: dim ? DIM_SHADOW : undefined }}
    />
  )
}

interface StepFooterProps {
  position: number
  total: number
  hasPrevious: boolean
  isLast: boolean
  labels: TourLabels
  primaryRef: React.Ref<HTMLButtonElement>
  onBack: () => void
  onNext: () => void
}

function StepFooter({ position, total, hasPrevious, isLast, labels, primaryRef, onBack, onNext }: StepFooterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span data-slot="tour-count" className="mr-auto text-[13px] text-muted-foreground tabular-nums">
        {position} of {total}
      </span>
      {hasPrevious ? (
        <Button variant="ghost" size="sm" className={BUTTON_SIZE_CLASS} onClick={onBack}>
          {labels.back}
        </Button>
      ) : null}
      <Button ref={primaryRef} variant="mise" size="sm" className={BUTTON_SIZE_CLASS} onClick={onNext}>
        {isLast ? labels.finish : labels.next}
      </Button>
    </div>
  )
}

function CloseButton({ label }: { label: string }) {
  return (
    <DialogPrimitive.Close aria-label={label} className={cn(CLOSE_CLASS)}>
      <X aria-hidden="true" className="size-4" />
    </DialogPrimitive.Close>
  )
}

interface StepCopyProps {
  step: TourStep
  closeLabel: string
}

function StepCopy({ step, closeLabel }: StepCopyProps) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <DialogPrimitive.Title className="min-w-0 pt-1 text-[15px] leading-6 font-medium">{step.title}</DialogPrimitive.Title>
        <CloseButton label={closeLabel} />
      </div>
      {step.body ? <DialogPrimitive.Description className="text-sm leading-5 text-muted-foreground">{step.body}</DialogPrimitive.Description> : null}
    </>
  )
}

interface ChecklistProps extends Omit<StepFooterProps, "hasPrevious"> {
  title: React.ReactNode
  steps: readonly TourStep[]
  shown: readonly number[]
  index: number
  done: ReadonlySet<number>
  onJump: (index: number) => void
}

function ChecklistMark({ state }: { state: "done" | "current" | "upcoming" }) {
  // Done is a result, so it takes the fixed hue: the accent may itself be any colour.
  if (state === "done") return <Check aria-hidden="true" className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
  return (
    <span
      aria-hidden="true"
      className={cn("mx-0.5 size-3 shrink-0 rounded-full border-2", state === "current" ? "border-foreground" : "border-border")}
    />
  )
}

function TourChecklist({ title, steps, shown, index, done, position, total, isLast, labels, primaryRef, onJump, onBack, onNext }: ChecklistProps) {
  const current = steps[index]
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <DialogPrimitive.Title className="min-w-0 text-[15px] leading-6 font-medium">{title}</DialogPrimitive.Title>
        <CloseButton label={labels.close} />
      </div>
      <ol data-slot="tour-checklist" className="grid gap-1">
        {shown.map((stepIndex) => {
          const isCurrent = stepIndex === index
          const state = isCurrent ? "current" : done.has(stepIndex) ? "done" : "upcoming"
          return (
            <li key={stepIndex}>
              <button
                type="button"
                aria-current={isCurrent ? "step" : undefined}
                onClick={() => onJump(stepIndex)}
                className={cn(
                  "flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm outline-none pointer-coarse:min-h-10",
                  "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  isCurrent ? "font-medium" : "text-muted-foreground",
                )}
              >
                <ChecklistMark state={state} />
                <span className="min-w-0">{steps[stepIndex].title}</span>
              </button>
            </li>
          )
        })}
      </ol>
      {current?.body ? <DialogPrimitive.Description className="text-sm leading-5 text-muted-foreground">{current.body}</DialogPrimitive.Description> : null}
      <StepFooter {...{ position, total, isLast, labels, primaryRef, onBack, onNext }} hasPrevious={position > 1} />
    </>
  )
}

export { StepCopy, StepFooter, TourChecklist, TourHighlight, type TourLabels }
