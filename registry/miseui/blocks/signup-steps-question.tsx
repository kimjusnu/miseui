import type * as React from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { Button } from "@/registry/miseui/ui/button"
import { useFocusOnChange, type SignupFlow } from "./signup-steps-flow"
import { QuestionFields } from "./signup-steps-parts"

const STEP_TRAVEL_PX = 16

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

export { QuestionForm }
