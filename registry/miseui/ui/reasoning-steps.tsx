import type * as React from "react"
import { Check, TriangleAlert } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/registry/miseui/lib/utils"

type ReasoningStepStatus = "pending" | "active" | "done" | "error"

interface ReasoningStep {
  id: string
  label: string
  status: ReasoningStepStatus
  /** One line under the label: what the step found or why it failed. */
  detail?: string
}

/** Same breath as the thinking indicator, so both read as "the model is working". */
const BREATH_SECONDS = 0.9
const BREATH_SCALE = 1.4
const SEPARATOR = " · "

interface ReasoningStepsProps extends React.ComponentProps<"details"> {
  steps: ReadonlyArray<ReasoningStep>
  /** Start expanded. The user can still collapse it. */
  defaultOpen?: boolean
  /** Replaces the generated header ("3 steps · Searching docs"). */
  summary?: string
}

function describeSteps(steps: ReadonlyArray<ReasoningStep>) {
  const count = `${steps.length} ${steps.length === 1 ? "step" : "steps"}`
  const active = steps.find((step) => step.status === "active")
  if (active) return `${count}${SEPARATOR}${active.label}`
  if (steps.some((step) => step.status === "error")) return `${count}${SEPARATOR}error`
  if (steps.length > 0 && steps.every((step) => step.status === "done")) return `${count}${SEPARATOR}done`
  return count
}

function ReasoningSteps({ steps, defaultOpen = false, summary, className, ...props }: ReasoningStepsProps) {
  return (
    <details
      data-slot="reasoning-steps"
      open={defaultOpen}
      className={cn("rounded-lg border text-sm", className)}
      {...props}
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-muted-foreground select-none",
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        {summary ?? describeSteps(steps)}
      </summary>
      <ol data-slot="reasoning-steps-list" className="relative ml-5 flex flex-col gap-3 border-l py-3 pr-3 pl-5">
        {steps.map((step) => (
          <li key={step.id} data-status={step.status} className="relative flex flex-col gap-0.5">
            <span className="absolute top-1 -left-[1.6rem] flex size-3.5 items-center justify-center">
              <StepMark status={step.status} />
            </span>
            <span className={cn(step.status === "pending" && "text-muted-foreground", step.status === "error" && "text-destructive")}>
              {step.label}
            </span>
            {step.detail ? <span className="text-xs text-muted-foreground">{step.detail}</span> : null}
          </li>
        ))}
      </ol>
    </details>
  )
}

function StepMark({ status }: { status: ReasoningStepStatus }) {
  const reduceMotion = useReducedMotion()

  if (status === "done") return <Check className="size-3.5 text-foreground" aria-hidden="true" />
  if (status === "error") return <TriangleAlert className="size-3.5 text-destructive" aria-hidden="true" />
  if (status === "pending") {
    return <span className="size-2.5 rounded-full border-2 border-muted-foreground" aria-hidden="true" />
  }
  return (
    <motion.span
      className="size-2.5 rounded-full bg-mise"
      aria-hidden="true"
      initial={false}
      animate={reduceMotion ? { scale: 1 } : { scale: [1, BREATH_SCALE, 1] }}
      transition={reduceMotion ? { duration: 0 } : { duration: BREATH_SECONDS, repeat: Infinity, ease: "easeInOut" }}
    />
  )
}

export { ReasoningSteps, describeSteps, type ReasoningStep, type ReasoningStepStatus, type ReasoningStepsProps }
