import { useRef, useState } from "react"
import { Loader2, X } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { Progress } from "@/registry/miseui/ui/progress"
import { INK_FILL_CLASS, type OnboardingViewProps } from "./onboarding-checklist-panel"
import { useOnboarding, type Onboarding } from "./onboarding-checklist-state"

function BannerText({ onboarding, finishNote }: { onboarding: Onboarding; finishNote: string }) {
  return (
    <div className="min-w-0 @2xl:flex-1">
      <p role="status" className="text-[13px] leading-5 text-pretty">
        <span className="font-medium tabular-nums">
          {onboarding.doneCount} of {onboarding.total} done.
        </span>{" "}
        <span className="text-muted-foreground">{onboarding.next ? `Next: ${onboarding.next.title}` : finishNote}</span>
      </p>
      {onboarding.failure ? (
        <p role="alert" className="text-[13px] leading-5 text-pretty text-destructive">
          {onboarding.failure.message}
        </p>
      ) : null}
    </div>
  )
}

/** A row of its own at the top of the page: the work stays the main thing, and the next step is one press away. */
function OnboardingBanner({ steps, completed, defaultCompleted, onCompletedChange, onStep, finishLabel, onFinish, onDismiss, title, description, className, children, ...props }: OnboardingViewProps) {
  const onboarding = useOnboarding({ steps, completed, defaultCompleted, onCompletedChange, onStep })
  const [hidden, setHidden] = useState(false)
  const rootRef = useRef<HTMLElement>(null)
  const next = onboarding.next
  const pending = next !== undefined && onboarding.pendingId === next.id

  const hide = () => {
    setHidden(true)
    onDismiss?.()
    // The button that had focus just left with the row. The page below is where they are going.
    rootRef.current?.focus()
  }

  return (
    <section ref={rootRef} tabIndex={-1} data-slot="onboarding-checklist" data-variant="banner" className={cn("@container w-full outline-none", className)} {...props}>
      {hidden ? null : (
        <div role="region" aria-label={title} data-slot="onboarding-banner" className="relative border-b bg-background">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 py-2 ps-4 pe-2 @2xl:flex @2xl:gap-4 @2xl:pe-3">
            <BannerText onboarding={onboarding} finishNote={description} />
            {next ? (
              <Button
                variant="mise"
                size="sm"
                aria-busy={pending || undefined}
                aria-disabled={pending || undefined}
                onClick={() => void onboarding.press(next.id)}
                className="col-start-1 row-start-2 justify-self-start pointer-coarse:h-10"
              >
                {pending ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
                {next.actionLabel}
              </Button>
            ) : (
              <Button
                variant="mise"
                size="sm"
                onClick={() => {
                  onFinish?.()
                  hide()
                }}
                className="col-start-1 row-start-2 justify-self-start pointer-coarse:h-10"
              >
                {finishLabel}
              </Button>
            )}
            <Button variant="ghost" size="icon" aria-label="Hide setup for now" onClick={hide} className="col-start-2 row-start-1 size-8 pointer-coarse:size-10">
              <X aria-hidden="true" />
            </Button>
          </div>
          {/* The row's own bottom edge is the bar, so progress takes no height from the page. */}
          <Progress variant="thin" effect="spring" label="Setup progress" value={onboarding.doneCount} max={Math.max(onboarding.total, 1)} className={cn("absolute inset-x-0 -bottom-px rounded-none", INK_FILL_CLASS)} />
        </div>
      )}
      {children}
    </section>
  )
}

export { OnboardingBanner }
