import type * as React from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import {
  useFocusOnChange,
  useSignupFlow,
  type SignupCreditedStep,
  type SignupFlow,
  type SignupQuestionStep,
  type SignupStep,
  type SignupValues,
} from "@/registry/miseui/blocks/signup-steps-flow"
import { Confirmation, QuestionFields, StepProgress } from "@/registry/miseui/blocks/signup-steps-parts"

const EMAIL_SHAPE = /^\S+@\S+$/
const STEP_TRAVEL_PX = 16

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
  steps = DEFAULT_STEPS,
  onComplete,
  submitLabel = "Create workspace",
  confirmation = defaultConfirmation,
  className,
  ...props
}: SignupStepsProps) {
  const flow = useSignupFlow(steps, onComplete)
  if (flow.questions.length === 0) return null

  const credited = steps.length - flow.questions.length
  const completed = flow.done ? steps.length : credited + flow.index

  return (
    <section data-slot="signup-steps" className={cn("@container w-full bg-muted/40 dark:bg-background px-4 py-12 @md:px-6 @2xl:py-16", className)} {...props}>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-8 rounded-2xl border bg-popover p-6 shadow-[0_16px_40px_-24px_color-mix(in_oklab,var(--mise)_24%,oklch(0_0_0/40%))] @md:p-8">
        <StepProgress steps={steps} completed={completed} />
        {flow.done ? <Confirmation {...confirmation(flow.values)} /> : <QuestionForm flow={flow} submitLabel={submitLabel} />}
      </div>
    </section>
  )
}

interface QuestionFormProps {
  flow: SignupFlow
  submitLabel: string
}

/** One form, so Enter advances from anywhere. Only the question itself moves; the buttons stay under the thumb. */
function QuestionForm({ flow, submitLabel }: QuestionFormProps) {
  const reduceMotion = useReducedMotion()
  const fieldRef = useFocusOnChange<HTMLInputElement>(flow.index)
  const isLast = flow.index === flow.questions.length - 1

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    flow.next()
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-8">
      <motion.div
        key={flow.step.id}
        className="flex flex-col gap-8"
        initial={reduceMotion ? false : { opacity: 0, x: flow.direction * STEP_TRAVEL_PX }}
        animate={{ opacity: 1, x: 0 }}
        transition={SPRING_DEFAULT}
      >
        <h2 className="text-display text-3xl leading-[1.12]! text-balance">
          {flow.step.question}
          {flow.step.aside ? <span className="text-muted-foreground"> {flow.step.aside}</span> : null}
        </h2>
        <QuestionFields flow={flow} fieldRef={fieldRef} />
      </motion.div>
      <div className="flex items-center gap-3">
        {flow.index > 0 ? (
          <Button type="button" variant="ghost" disabled={flow.pending} onClick={flow.back}>
            <ArrowLeft /> Back
          </Button>
        ) : null}
        <Button type="submit" disabled={flow.pending} aria-busy={flow.pending || undefined} className="ml-auto">
          {flow.pending ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
          {isLast ? submitLabel : "Continue"}
        </Button>
      </div>
    </form>
  )
}

export {
  SignupSteps,
  type SignupCreditedStep,
  type SignupQuestionStep,
  type SignupStep,
  type SignupStepsProps,
  type SignupValues,
}
