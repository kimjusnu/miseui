import type * as React from "react"
import { useId } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { Input } from "@/registry/miseui/ui/input"
import { Kbd } from "@/registry/miseui/ui/kbd"
import { Label } from "@/registry/miseui/ui/label"
import { useFocusOnChange, type SignupFlow } from "./signup-steps-flow"
import { Confirmation, ConsentField, ProgressTrack } from "./signup-steps-parts"
import type { SignupVariantProps } from "./signup-steps-rail"

const STEP_TRAVEL_PX = 16

/** The answer just given, read back so this feels like being listened to. A password is never read back. */
function lastAnswer(flow: SignupFlow) {
  const previous = flow.questions[flow.index - 1]
  if (!previous || previous.type === "password") return null
  return flow.values[previous.id]?.trim() || null
}

/** Large type on one hairline: the question is the page, so the field should not look like a form to fill in. */
function LargeField({ flow, fieldRef }: { flow: SignupFlow; fieldRef: React.RefObject<HTMLInputElement | null> }) {
  const baseId = useId()
  const { step, error } = flow
  const fieldId = `${baseId}-field`
  const noteId = `${baseId}-note`
  const note = error ?? step.hint
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor={fieldId} className="sr-only">
          {step.fieldLabel}
        </Label>
        <Input
          ref={fieldRef}
          id={fieldId}
          type={step.type ?? "text"}
          autoComplete={step.autoComplete}
          placeholder={step.placeholder}
          value={flow.values[step.id] ?? ""}
          readOnly={flow.pending}
          onChange={(event) => flow.change(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={note ? noteId : undefined}
          className="h-12 rounded-none border-0 border-b-2 bg-transparent px-0 text-xl shadow-none focus-visible:border-foreground focus-visible:ring-0 md:text-xl"
        />
        {note ? (
          <p
            id={noteId}
            role={error ? "alert" : undefined}
            className={cn("text-[13px] leading-snug text-pretty", error ? "text-destructive" : "text-muted-foreground")}
          >
            {note}
          </p>
        ) : null}
      </div>
      {step.consent ? <ConsentField flow={flow} text={step.consent} id={`${baseId}-consent`} /> : null}
    </div>
  )
}

function ConversationQuestion({ flow, submitLabel }: { flow: SignupFlow; submitLabel: string }) {
  const reduceMotion = useReducedMotion()
  const fieldRef = useFocusOnChange<HTMLInputElement>(flow.index)
  const isLast = flow.index === flow.questions.length - 1
  const answer = lastAnswer(flow)

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    flow.next()
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-8">
      <motion.div
        key={flow.step.id}
        className="flex flex-col gap-6"
        initial={reduceMotion ? false : { opacity: 0, y: flow.direction * STEP_TRAVEL_PX }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_DEFAULT}
      >
        {answer ? <p className="text-[15px] leading-relaxed break-words text-muted-foreground">Got it: {answer}</p> : null}
        <h2 className="text-display text-3xl leading-[1.12]! text-balance @2xl:text-4xl">
          {flow.step.question}
          {flow.step.aside ? <span className="text-muted-foreground"> {flow.step.aside}</span> : null}
        </h2>
        <LargeField flow={flow} fieldRef={fieldRef} />
      </motion.div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={flow.pending} aria-busy={flow.pending || undefined}>
          {flow.pending ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
          {isLast ? submitLabel : "Continue"}
        </Button>
        {flow.index > 0 ? (
          <Button type="button" size="lg" variant="ghost" disabled={flow.pending} onClick={flow.back}>
            <ArrowLeft /> Back
          </Button>
        ) : null}
        <span className="hidden items-center gap-2 text-[13px] text-muted-foreground pointer-fine:flex">
          or press <Kbd>Enter</Kbd>
        </span>
      </div>
    </form>
  )
}

function SignupConversation({ steps, flow, submitLabel, finished, className, ...props }: SignupVariantProps) {
  const credited = steps.length - flow.questions.length
  const completed = flow.done ? steps.length : credited + flow.index
  return (
    <section data-slot="signup-steps" data-variant="conversation" className={cn("@container flex min-h-[560px] w-full flex-col bg-background", className)} {...props}>
      <ProgressTrack total={steps.length} completed={completed} className="rounded-none" />
      <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-1 flex-col justify-center px-6 py-12">
        {finished ? <Confirmation {...finished} /> : <ConversationQuestion flow={flow} submitLabel={submitLabel} />}
      </div>
    </section>
  )
}

export { SignupConversation, lastAnswer }
