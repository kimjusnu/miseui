import type * as React from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { Steps, type StepItem } from "@/registry/miseui/ui/steps"
import type { SignupFlow, SignupStep } from "./signup-steps-flow"
import { Confirmation } from "./signup-steps-parts"
import { QuestionForm } from "./signup-steps-question"

interface SignupVariantProps extends React.ComponentProps<"section"> {
  steps: readonly SignupStep[]
  flow: SignupFlow
  submitLabel: string
  finished: { title: string; description: string } | null
}

/** The shared question form stays 36 px with a mouse. A checkbox is a button too, so this names the kit's buttons. */
const TOUCH_TARGETS_CLASS = "pointer-coarse:[&_[data-slot=button]]:h-10 pointer-coarse:[&_input]:h-10"

function questionsLeft(flow: SignupFlow) {
  if (flow.done) return "Nothing left."
  const left = flow.questions.length - flow.index
  return `${left} ${left === 1 ? "question" : "questions"} left.`
}

/** A step ahead says what it is for. The current one already says so in its heading, and a finished one is done. */
function railItems(steps: readonly SignupStep[], current: number): readonly StepItem[] {
  return steps.map((step, index) => ({
    title: step.label,
    description: index > current && !step.credited ? step.aside : undefined,
  }))
}

function SignupRail({ steps, flow, submitLabel, finished, className, ...props }: SignupVariantProps) {
  const credited = steps.length - flow.questions.length
  const current = flow.done ? steps.length : credited + flow.index
  const items = railItems(steps, current)
  // Credited steps were never questions. A press on one goes to the first question, and goTo clamps it there.
  const select = flow.done || flow.pending ? undefined : (index: number) => flow.goTo(index - credited)

  return (
    <section data-slot="signup-steps" data-variant="rail" className={cn("@container w-full bg-muted/40 dark:bg-background", className)} {...props}>
      <div className="px-4 py-12 @md:px-6 @2xl:py-16">
        <div className="mx-auto grid w-full max-w-4xl grid-cols-[minmax(0,1fr)] overflow-hidden rounded-2xl border bg-popover @3xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <aside data-testid="signup-rail" className="hidden flex-col gap-8 border-r bg-muted p-8 @3xl:flex dark:bg-card">
            <p className="text-display text-2xl leading-[1.12]! text-balance">
              {questionsLeft(flow)} {flow.done ? null : <span className="text-muted-foreground">Then your workspace is ready.</span>}
            </p>
            <Steps aria-label="Sign-up steps" variant="vertical" effect="draw" steps={items} current={current} onStepSelect={select} />
          </aside>
          <div className={cn("flex min-w-0 flex-col gap-8 p-6 @md:p-8 @3xl:min-h-[480px] @3xl:justify-center @3xl:p-12", TOUCH_TARGETS_CLASS)}>
            <div data-testid="signup-rail-compact" className="@3xl:hidden">
              <Steps aria-label="Sign-up progress" variant="compact" steps={items} current={current} />
            </div>
            {finished ? <Confirmation {...finished} /> : <QuestionForm flow={flow} submitLabel={submitLabel} />}
          </div>
        </div>
      </div>
    </section>
  )
}

export { SignupRail, type SignupVariantProps }
