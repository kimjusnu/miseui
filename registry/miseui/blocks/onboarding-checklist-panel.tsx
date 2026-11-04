import type * as React from "react"
import { useEffect, useId, useRef, useState } from "react"
import { ChevronDown, Loader2 } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { Checkbox } from "@/registry/miseui/ui/checkbox"
import { Progress } from "@/registry/miseui/ui/progress"
import { useOnboarding, type Onboarding, type OnboardingOptions, type OnboardingStep } from "./onboarding-checklist-state"

const FOCUS_NEXT_SELECTOR = "[data-focus-next]"
/** In ink: the one accent on this screen belongs to the next thing to press. */
const INK_FILL_CLASS = "[&_[data-slot=progress-fill]]:bg-foreground"

interface OnboardingViewProps extends Omit<React.ComponentProps<"section">, "title">, OnboardingOptions {
  title: string
  description: string
  finishLabel: string
  onFinish?: () => void
  onDismiss?: () => void
}

interface StepRowProps {
  step: OnboardingStep
  onboarding: Onboarding
  open: boolean
  onOpen: () => void
  onPress: () => void
}

function StepBody({ step, onboarding, onPress, id }: Pick<StepRowProps, "step" | "onboarding" | "onPress"> & { id: string }) {
  const next = onboarding.next?.id === step.id
  const pending = onboarding.pendingId === step.id
  const failed = onboarding.failure?.id === step.id
  return (
    <div id={id} className="flex flex-col items-start gap-3 pb-3">
      <p className="text-[13px] leading-relaxed text-pretty text-muted-foreground">{step.description}</p>
      {failed ? (
        <p role="alert" className="text-[13px] leading-snug text-pretty text-destructive">
          {onboarding.failure?.message}
        </p>
      ) : null}
      {/* aria-disabled and not disabled: a disabled button drops keyboard focus while the work runs. */}
      <Button
        variant={next ? "mise" : "outline"}
        data-focus-next={next ? "" : undefined}
        aria-busy={pending || undefined}
        aria-disabled={onboarding.pendingId !== null || undefined}
        onClick={onPress}
        className="pointer-coarse:h-10"
      >
        {pending ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
        {step.actionLabel}
      </Button>
    </div>
  )
}

function StepRow({ step, onboarding, open, onOpen, onPress }: StepRowProps) {
  const bodyId = useId()
  const done = onboarding.done.includes(step.id)
  return (
    <li data-state={done ? "done" : open ? "open" : "closed"} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-1 px-2 py-1 @3xl:px-3">
      {/* The label is the hit target: a 16 px box stays 16 px while the press area reaches 40. */}
      <label className="inline-flex size-10 cursor-pointer items-center justify-center self-start">
        <Checkbox aria-label={step.title} checked={done} disabled={onboarding.pendingId !== null} onCheckedChange={(state) => onboarding.setDone(step.id, state === true)} />
      </label>
      <div className="min-w-0 pe-2">
        {done ? (
          <p className="flex min-h-10 items-center text-[15px] text-pretty text-muted-foreground">{step.title}</p>
        ) : (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={open ? bodyId : undefined}
            onClick={onOpen}
            className="flex min-h-10 w-full items-center justify-between gap-2 rounded-md text-start text-[15px] text-pretty outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="min-w-0">{step.title}</span>
            <ChevronDown aria-hidden="true" className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-fast) ease-(--ease-mise) motion-reduce:transition-none", open && "rotate-180")} />
          </button>
        )}
        {open && !done ? <StepBody id={bodyId} step={step} onboarding={onboarding} onPress={onPress} /> : null}
      </div>
    </li>
  )
}

/** The pressed button goes away with its row, which would drop keyboard focus onto the page. */
function useFocusAfterStep(plate: React.RefObject<HTMLDivElement | null>, doneCount: number) {
  const pendingRef = useRef(false)
  useEffect(() => {
    if (!pendingRef.current) return
    pendingRef.current = false
    plate.current?.querySelector<HTMLElement>(FOCUS_NEXT_SELECTOR)?.focus()
  }, [doneCount, plate])
  return pendingRef
}

function StepsPlate({ steps, onboarding, finish }: { steps: readonly OnboardingStep[]; onboarding: Onboarding; finish: React.ReactNode }) {
  const plateRef = useRef<HTMLDivElement>(null)
  const pendingFocusRef = useFocusAfterStep(plateRef, onboarding.doneCount)
  const [chosenId, setChosenId] = useState<string | null>(null)
  const chosenOpen = chosenId !== null && !onboarding.done.includes(chosenId)
  const openId = chosenOpen ? chosenId : onboarding.next?.id

  const pressStep = async (id: string) => {
    pendingFocusRef.current = true
    const finished = await onboarding.press(id)
    // Failed: the row stays open, with its message, whichever row that is.
    if (finished) setChosenId(null)
    else pendingFocusRef.current = false
  }

  return (
    <div ref={plateRef} className="min-w-0 rounded-2xl border bg-background dark:bg-card">
      {steps.length > 0 ? (
        <ol className="flex flex-col divide-y">
          {steps.map((step) => (
            <StepRow
              key={step.id}
              step={step}
              onboarding={onboarding}
              open={openId === step.id}
              onOpen={() => setChosenId(openId === step.id ? "" : step.id)}
              onPress={() => void pressStep(step.id)}
            />
          ))}
        </ol>
      ) : null}
      {onboarding.allDone ? (
        <div className={cn("flex flex-wrap items-center justify-between gap-3 p-4", steps.length > 0 && "border-t")}>
          <p className="text-[15px]">That is everything.</p>
          {finish}
        </div>
      ) : null}
    </div>
  )
}

/** Heading and count stay beside the list on wide screens, so the end stays in sight while a step is open. */
function OnboardingPanel({ steps, completed, defaultCompleted, onCompletedChange, onStep, title, description, finishLabel, onFinish, onDismiss, className, ...props }: OnboardingViewProps) {
  const onboarding = useOnboarding({ steps, completed, defaultCompleted, onCompletedChange, onStep })
  const finish = (
    <Button variant="mise" data-focus-next="" onClick={onFinish} className="pointer-coarse:h-10">
      {finishLabel}
    </Button>
  )
  return (
    <section data-slot="onboarding-checklist" data-variant="panel" aria-label="Setup" className={cn("@container flex w-full flex-col bg-muted dark:bg-background", className)} {...props}>
      <div className="flex min-h-[640px] flex-1 items-center px-4 py-12 @3xl:px-8">
        <div className="mx-auto grid w-full max-w-4xl grid-cols-[minmax(0,1fr)] items-start gap-8 @3xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @3xl:gap-12">
          <div className="flex min-w-0 flex-col gap-6">
            <h2 className="text-display text-3xl leading-[1.12]! text-balance">
              {title} <span className="text-muted-foreground">{description}</span>
            </h2>
            {onboarding.total > 0 ? (
              <div className="flex flex-col gap-2">
                <p role="status" className="text-[13px] text-muted-foreground tabular-nums">
                  {onboarding.doneCount} of {onboarding.total} done
                </p>
                <Progress label="Setup progress" effect="spring" value={onboarding.doneCount} max={onboarding.total} className={INK_FILL_CLASS} />
              </div>
            ) : null}
            {onDismiss ? (
              <Button variant="ghost" onClick={onDismiss} className="-ms-3 self-start text-muted-foreground pointer-coarse:h-10">
                Hide this for now
              </Button>
            ) : null}
          </div>
          <StepsPlate steps={steps} onboarding={onboarding} finish={finish} />
        </div>
      </div>
    </section>
  )
}

export { INK_FILL_CLASS, OnboardingPanel, type OnboardingViewProps }
