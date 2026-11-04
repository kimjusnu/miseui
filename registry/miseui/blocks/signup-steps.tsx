import type * as React from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { SignupConversation } from "./signup-steps-conversation"
import {
  useSignupFlow,
  type SignupCreditedStep,
  type SignupQuestionStep,
  type SignupStep,
  type SignupValues,
} from "./signup-steps-flow"
import { Confirmation, StepProgress } from "./signup-steps-parts"
import { QuestionForm } from "./signup-steps-question"
import { SignupRail } from "./signup-steps-rail"

type SignupStepsVariant = "card" | "rail" | "conversation"

const EMAIL_SHAPE = /^\S+@\S+$/

const DEFAULT_STEPS: readonly SignupStep[] = [
  { id: "start", label: "Started", credited: true },
  {
    id: "email",
    label: "Email",
    question: "What is your work email?",
    aside: "This is where your sign-in link goes.",
    fieldLabel: "Work email",
    hint: "There is no password to remember.",
    type: "email",
    autoComplete: "email",
    placeholder: "maya@northgate.studio",
    validate: (value) => (EMAIL_SHAPE.test(value.trim()) ? undefined : "Enter an email address, like maya@northgate.studio."),
  },
  {
    id: "workspace",
    label: "Workspace",
    question: "What should we call your workspace?",
    aside: "Your team will see this name.",
    fieldLabel: "Workspace name",
    hint: "You can change it later.",
    autoComplete: "organization",
    placeholder: "Northgate Studio",
    consent: "I agree to the Terms of Service and Privacy Policy.",
  },
]

function defaultConfirmation(values: SignupValues) {
  return {
    title: "Check your inbox.",
    description: values.email ? `We sent a sign-in link to ${values.email}.` : "We sent you a sign-in link.",
  }
}

interface SignupStepsProps extends React.ComponentProps<"section"> {
  /** `card` one card with a bar on top, `rail` steps in a side rail with what is left, `conversation` one large question per screen. */
  variant?: SignupStepsVariant
  /** Mark a first step `credited` to start the bar with real progress on it. */
  steps?: readonly SignupStep[]
  /** Called once with every answer, by step id. Return a promise to get the loading state; a rejection's message is shown inline. */
  onComplete?: (values: SignupValues) => void | Promise<void>
  /** Label of the last step's button. */
  submitLabel?: string
  /** What the final screen says. */
  confirmation?: (values: SignupValues) => { title: string; description: string }
}

function SignupSteps({
  variant,
  steps = DEFAULT_STEPS,
  onComplete,
  submitLabel = "Create workspace",
  confirmation = defaultConfirmation,
  className,
  ...props
}: SignupStepsProps) {
  const flow = useSignupFlow(steps, onComplete)
  if (flow.questions.length === 0) return null

  const shared = { steps, flow, submitLabel, finished: flow.done ? confirmation(flow.values) : null, className }
  if (variant === "rail") return <SignupRail {...shared} {...props} />
  if (variant === "conversation") return <SignupConversation {...shared} {...props} />

  const credited = steps.length - flow.questions.length
  const completed = flow.done ? steps.length : credited + flow.index

  return (
    <section data-slot="signup-steps" data-variant="card" className={cn("@container w-full bg-muted/40 dark:bg-background px-4 py-12", className)} {...props}>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-8 rounded-2xl border bg-popover p-6 shadow-[0_16px_40px_-24px_color-mix(in_oklab,var(--mise)_24%,oklch(0_0_0/40%))] @md:p-8">
        <StepProgress steps={steps} completed={completed} />
        {flow.done ? <Confirmation {...confirmation(flow.values)} /> : <QuestionForm flow={flow} submitLabel={submitLabel} />}
      </div>
    </section>
  )
}

export {
  SignupSteps,
  type SignupCreditedStep,
  type SignupQuestionStep,
  type SignupStep,
  type SignupStepsProps,
  type SignupStepsVariant,
  type SignupValues,
}
