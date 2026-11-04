import { useEffect, useRef, useState } from "react"
import { Check, Hand, Loader2, X } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/registry/miseui/ui/dialog"
import { Progress } from "@/registry/miseui/ui/progress"
import type { OnboardingViewProps } from "./onboarding-checklist-panel"
import { useOnboarding, type Onboarding, type OnboardingStep } from "./onboarding-checklist-state"

interface OnboardingDialogProps extends OnboardingViewProps {
  /** A welcome is meant to greet people on arrival, so it starts open. Pass `open` to decide from your own first-visit flag. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

/** Screen 0 greets, then one screen per step, then the closing one. */
const WELCOME_SCREEN = 0

function nextOpenScreen(from: number, steps: readonly OnboardingStep[], done: readonly string[]) {
  const ahead = steps.findIndex((step, index) => index + 1 > from && !done.includes(step.id))
  return ahead === -1 ? steps.length + 1 : ahead + 1
}

interface ScreenCopy {
  title: string
  description: string
  icon: NonNullable<OnboardingStep["icon"]>
}

function screenCopy(screen: number, step: OnboardingStep | undefined, welcome: Pick<ScreenCopy, "title" | "description">, onboarding: Onboarding): ScreenCopy {
  if (screen === WELCOME_SCREEN) return { ...welcome, icon: Hand }
  if (step) return { title: step.title, description: step.description, icon: step.icon ?? Hand }
  const everything = onboarding.doneCount === onboarding.total
  return {
    title: everything ? "That is everything." : `${onboarding.doneCount} of ${onboarding.total} done.`,
    description: everything ? "You are ready to start." : "The rest waits behind the Setup button.",
    icon: Check,
  }
}

interface FooterProps {
  screen: number
  step: OnboardingStep | undefined
  onboarding: Onboarding
  finishLabel: string
  onSkip: () => void
  onPrimary: () => void
}

function ScreenFooter({ screen, step, onboarding, finishLabel, onSkip, onPrimary }: FooterProps) {
  const welcome = screen === WELCOME_SCREEN
  const closing = !welcome && !step
  const pending = step !== undefined && onboarding.pendingId === step.id
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 px-6 pb-6">
      {closing ? null : (
        <Button variant="ghost" onClick={onSkip} className="pointer-coarse:h-10">
          Not now
        </Button>
      )}
      <Button variant="mise" aria-busy={pending || undefined} aria-disabled={pending || undefined} onClick={onPrimary} className="pointer-coarse:h-10">
        {pending ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
        {welcome ? "Start" : (step?.actionLabel ?? finishLabel)}
      </Button>
    </div>
  )
}

function ScreenTop({ onboarding }: { onboarding: Onboarding }) {
  const cells = Math.max(onboarding.total, 1)
  return (
    <div className="flex items-center gap-3 ps-6 pe-2 pt-2">
      <p role="status" className="sr-only">
        {onboarding.doneCount} of {onboarding.total} done
      </p>
      {/* In ink: the one accent in this dialog belongs to the button that moves things on. */}
      <Progress variant="segmented" effect="spring" label="Setup progress" value={onboarding.doneCount} max={cells} steps={cells} className="flex-1 [&_[data-slot=progress-segment]>span]:bg-foreground" />
      <DialogClose asChild>
        <Button variant="ghost" size="icon" aria-label="Close" className="size-10">
          <X aria-hidden="true" />
        </Button>
      </DialogClose>
    </div>
  )
}

interface WelcomeDialogProps extends Pick<OnboardingDialogProps, "steps" | "title" | "description" | "finishLabel" | "onFinish"> {
  onboarding: Onboarding
  onClose: () => void
}

function WelcomeDialog({ steps, title, description, finishLabel, onFinish, onboarding, onClose }: WelcomeDialogProps) {
  const [screen, setScreen] = useState(WELCOME_SCREEN)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const step = steps[screen - 1]
  const copy = screenCopy(screen, step, { title, description }, onboarding)
  const Icon = copy.icon
  // The title takes focus on each new screen, so a screen reader hears the step and not silence.
  useEffect(() => {
    if (screen !== WELCOME_SCREEN) titleRef.current?.focus()
  }, [screen])

  const pressStep = async (id: string) => {
    const index = steps.findIndex((item) => item.id === id)
    if (await onboarding.press(id)) setScreen(nextOpenScreen(index + 1, steps, [...onboarding.done, id]))
  }
  const primary = () => {
    if (screen === WELCOME_SCREEN) return setScreen(nextOpenScreen(0, steps, onboarding.done))
    if (step) return void pressStep(step.id)
    onFinish?.()
    onClose()
  }
  const skip = () => (screen === WELCOME_SCREEN ? onClose() : setScreen(nextOpenScreen(screen, steps, onboarding.done)))

  return (
    <DialogContent
      showCloseButton={false}
      aria-describedby={undefined}
      onOpenAutoFocus={(event) => {
        event.preventDefault()
        titleRef.current?.focus()
      }}
      className="gap-0 rounded-2xl p-0 sm:max-w-md"
    >
      <ScreenTop onboarding={onboarding} />
      <div className="flex flex-col gap-4 px-6 pt-6 pb-8">
        <span aria-hidden="true" className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="size-6" />
        </span>
        <DialogTitle ref={titleRef} tabIndex={-1} className="text-display text-2xl leading-[1.12]! text-balance outline-none">
          {copy.title} <span className="block text-muted-foreground">{copy.description}</span>
        </DialogTitle>
        {onboarding.failure ? (
          <p role="alert" className="text-[13px] leading-snug text-pretty text-destructive">
            {onboarding.failure.message}
          </p>
        ) : null}
      </div>
      <ScreenFooter screen={screen} step={step} onboarding={onboarding} finishLabel={finishLabel} onSkip={skip} onPrimary={primary} />
    </DialogContent>
  )
}

/** One thing at a time, for a first visit where a whole list would read as homework. Closing it loses nothing: the Setup button stays on the page. */
function OnboardingDialog({ steps, completed, defaultCompleted, onCompletedChange, onStep, title, description, finishLabel, onFinish, onDismiss, open, defaultOpen = true, onOpenChange, className, children, ...props }: OnboardingDialogProps) {
  const onboarding = useOnboarding({ steps, completed, defaultCompleted, onCompletedChange, onStep })
  const [uncontrolled, setUncontrolled] = useState(defaultOpen)
  const setOpen = (next: boolean) => {
    setUncontrolled(next)
    onOpenChange?.(next)
    if (!next) onDismiss?.()
  }
  return (
    <section data-slot="onboarding-checklist" data-variant="dialog" aria-label="Setup" className={cn("@container relative min-h-[640px] w-full", className)} {...props}>
      {children}
      <Dialog open={open ?? uncontrolled} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="absolute end-4 bottom-4 tabular-nums shadow-md pointer-coarse:h-10 dark:shadow-black/40">
            Setup, {onboarding.doneCount} of {onboarding.total} done
          </Button>
        </DialogTrigger>
        <WelcomeDialog {...{ steps, title, description, finishLabel, onFinish, onboarding }} onClose={() => setOpen(false)} />
      </Dialog>
    </section>
  )
}

export { nextOpenScreen, OnboardingDialog, type OnboardingDialogProps }
