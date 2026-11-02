import type * as React from "react"
import { useEffect, useId, useRef } from "react"
import { Check } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"
import { Checkbox } from "@/registry/miseui/ui/checkbox"
import { Input } from "@/registry/miseui/ui/input"
import { Label } from "@/registry/miseui/ui/label"
import type { SignupFlow, SignupStep } from "@/registry/miseui/blocks/signup-steps-flow"

const PERCENT = 100
const CONFIRMATION_START = { opacity: 0, scale: 0.6 }
const CONFIRMATION_END = { opacity: 1, scale: 1 }

interface StepProgressProps {
  steps: readonly SignupStep[]
  /** How many steps count as finished, credited ones included. */
  completed: number
}

function StepProgress({ steps, completed }: StepProgressProps) {
  const reduceMotion = useReducedMotion()
  const percent = Math.round((completed / steps.length) * PERCENT)
  const current = Math.min(completed + 1, steps.length)
  return (
    <div className="flex flex-col gap-2">
      <div
        role="progressbar"
        aria-label="Sign-up progress"
        aria-valuemin={0}
        aria-valuemax={PERCENT}
        aria-valuenow={percent}
        aria-valuetext={`Step ${current} of ${steps.length}`}
        className="h-1 overflow-hidden rounded-full bg-muted"
      >
        {/* Sliding a full-width bar, not scaling it: scale would squash the rounded leading edge. */}
        <motion.div
          data-testid="progress-fill"
          data-reduced={reduceMotion ? "true" : "false"}
          className="h-full rounded-full bg-mise"
          initial={false}
          animate={{ x: `${percent - PERCENT}%` }}
          transition={reduceMotion ? { duration: 0 } : SPRING_DEFAULT}
        />
      </div>
      <ol className="grid text-[13px]" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, index) => (
          <li
            key={step.id}
            aria-current={index === completed ? "step" : undefined}
            className={cn(
              "flex min-w-0 items-center gap-1",
              index === completed ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {index < completed ? <Check aria-label="Done" className="size-3.5 shrink-0 text-foreground" /> : null}
            <span className="truncate">{step.label}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

interface QuestionFieldsProps {
  flow: SignupFlow
  fieldRef: React.RefObject<HTMLInputElement | null>
}

function QuestionFields({ flow, fieldRef }: QuestionFieldsProps) {
  const baseId = useId()
  const { step, error } = flow
  const fieldId = `${baseId}-field`
  const noteId = `${baseId}-note`
  const note = error ?? step.hint

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor={fieldId}>{step.fieldLabel}</Label>
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
        />
        {/* The error takes the hint's place, so the buttons below do not jump when it appears. */}
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

function ConsentField({ flow, text, id }: { flow: SignupFlow; text: string; id: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-5 items-center">
        <Checkbox
          id={id}
          checked={flow.consents[flow.step.id] ?? false}
          disabled={flow.pending}
          onCheckedChange={(checked) => flow.toggleConsent(checked === true)}
        />
      </span>
      <Label htmlFor={id} className="text-[13px] leading-5 font-normal">
        {text}
      </Label>
    </div>
  )
}

interface ConfirmationProps {
  title: string
  description: string
}

/** Takes focus so a screen reader hears the result instead of silence after the form disappears. */
function Confirmation({ title, description }: ConfirmationProps) {
  const reduceMotion = useReducedMotion()
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => headingRef.current?.focus(), [])
  return (
    <div className="flex flex-col items-start gap-6">
      <motion.span
        data-testid="confirmation-mark"
        className="grid size-12 place-items-center rounded-full bg-muted"
        initial={reduceMotion ? false : CONFIRMATION_START}
        animate={CONFIRMATION_END}
        transition={SPRING_DEFAULT}
      >
        <Check aria-hidden="true" className="size-6" />
      </motion.span>
      <h2 ref={headingRef} tabIndex={-1} className="text-display text-3xl leading-[1.12]! text-balance break-words outline-none">
        {title} <span className="text-muted-foreground">{description}</span>
      </h2>
    </div>
  )
}

export { Confirmation, QuestionFields, StepProgress }
