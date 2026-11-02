import type * as React from "react"
import { SEGMENT_CLASS, StepConnector, StepMarker, TITLE_CLASS, stepState, type StepState } from "@/registry/miseui/ui/steps-parts"
import { cn } from "@/registry/miseui/lib/utils"

type StepsVariant = "horizontal" | "vertical" | "compact" | "numbered"
type StepsEffect = "draw"

interface StepItem {
  title: React.ReactNode
  description?: React.ReactNode
  /** Marks this step as failed. It keeps its place in the order. */
  error?: boolean
}

interface StepsLabels {
  done: string
  error: string
  /** The line above the bar in `compact`. */
  count: (position: number, total: number) => string
}

const DEFAULT_LABELS: StepsLabels = {
  done: "Completed",
  error: "Error",
  count: (position, total) => `Step ${position} of ${total}`,
}

interface ListProps {
  steps: readonly StepItem[]
  current: number
  draw: boolean
  labels: StepsLabels
  onStepSelect?: (index: number) => void
}

const spokenState = (state: StepState, labels: StepsLabels) =>
  state === "done" || state === "error" ? <span className="sr-only">{labels[state]}: </span> : null

/** Only a finished step can be gone back to; a later one would skip the work in between. */
function StepTitle({ index, state, step, labels, onStepSelect, className }: { index: number; state: StepState; step: StepItem; labels: StepsLabels; onStepSelect?: (index: number) => void; className?: string }) {
  const text = (
    <>
      {spokenState(state, labels)}
      {step.title}
    </>
  )
  const classes = cn("block min-w-0 text-sm leading-5 break-words", TITLE_CLASS[state], className)
  if (state === "done" && onStepSelect) {
    return (
      <button
        type="button"
        data-slot="steps-link"
        onClick={() => onStepSelect(index)}
        className={cn(classes, "rounded-sm text-left underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:min-h-10")}
      >
        {text}
      </button>
    )
  }
  return <span className={classes}>{text}</span>
}

function HorizontalList({ steps, current, draw, labels, onStepSelect }: ListProps) {
  return (
    <ol data-slot="steps-list" className="grid min-w-0 auto-cols-fr grid-flow-col">
      {steps.map((step, index) => {
        const state = stepState(index, current, step.error)
        return (
          <li key={index} aria-current={state === "current" ? "step" : undefined} className="relative grid min-w-0 justify-items-center gap-2 px-1 text-center">
            {index > 0 ? (
              // Stops 4 px short of both markers, so neither needs an opaque fill that would have to match the surface behind it.
              <StepConnector axis="x" filled={index <= current} draw={draw} className="absolute top-[11px] right-[calc(50%+16px)] h-0.5 w-[calc(100%-32px)] rtl:right-auto rtl:left-[calc(50%+16px)]" />
            ) : null}
            <StepMarker state={state} number={index + 1} />
            <StepTitle {...{ index, state, step, labels, onStepSelect }} className="text-[13px]" />
          </li>
        )
      })}
    </ol>
  )
}

function VerticalList({ steps, current, draw, labels, onStepSelect }: ListProps) {
  return (
    <ol data-slot="steps-list" className="grid min-w-0">
      {steps.map((step, index) => {
        const state = stepState(index, current, step.error)
        const last = index === steps.length - 1
        return (
          <li key={index} aria-current={state === "current" ? "step" : undefined} className="relative flex min-w-0 gap-3 pb-6 last:pb-0">
            {last ? null : <StepConnector axis="y" filled={index < current} draw={draw} className="absolute top-7 bottom-1 left-[11px] w-0.5 rtl:right-[11px] rtl:left-auto" />}
            <StepMarker state={state} number={index + 1} />
            <div className="grid min-w-0">
              <StepTitle {...{ index, state, step, labels, onStepSelect }} className="leading-6" />
              {step.description ? <p className="text-[13px] leading-5 text-muted-foreground">{step.description}</p> : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function CompactList({ steps, current, labels }: ListProps) {
  const position = Math.min(current, steps.length - 1)
  const active = steps[position]
  return (
    <div className="grid min-w-0 gap-2">
      <p className="flex min-w-0 items-baseline justify-between gap-3 text-[13px] leading-5">
        <span className="min-w-0 truncate font-medium">{active?.title}</span>
        <span className="shrink-0 text-muted-foreground tabular-nums">{labels.count(position + 1, steps.length)}</span>
      </p>
      <ol data-slot="steps-list" className="grid auto-cols-fr grid-flow-col gap-1">
        {steps.map((step, index) => {
          const state = stepState(index, current, step.error)
          return (
            <li key={index} aria-current={state === "current" ? "step" : undefined} className="min-w-0">
              <span aria-hidden="true" data-slot="steps-segment" data-state={state} className={cn("block h-1 rounded-full", SEGMENT_CLASS[state])} />
              <span className="sr-only">
                {spokenState(state, labels)}
                {step.title}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function NumberedList({ steps, current, labels, onStepSelect }: ListProps) {
  return (
    <ol data-slot="steps-list" className="grid min-w-0 divide-y border-y">
      {steps.map((step, index) => {
        const state = stepState(index, current, step.error)
        return (
          <li key={index} aria-current={state === "current" ? "step" : undefined} className="flex min-w-0 gap-4 py-3">
            <span aria-hidden="true" data-slot="steps-number" className={cn("w-6 shrink-0 text-right text-[15px] leading-5 font-medium tabular-nums", state === "upcoming" ? "text-muted-foreground" : TITLE_CLASS[state])}>
              {index + 1}
            </span>
            <div className="grid min-w-0 gap-1">
              <StepTitle {...{ index, state, step, labels, onStepSelect }} />
              {step.description ? <p className="text-[13px] leading-5 text-muted-foreground">{step.description}</p> : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

const LIST: Record<StepsVariant, (props: ListProps) => React.ReactNode> = {
  horizontal: HorizontalList,
  vertical: VerticalList,
  compact: CompactList,
  numbered: NumberedList,
}

type StepsProps = Omit<React.ComponentProps<"nav">, "children"> & {
  steps: readonly StepItem[]
  /** Index of the step in progress. Past the last index means everything is done. */
  current?: number
  /** `horizontal` markers on a line, `vertical` with room for details, `compact` a bar with a count, `numbered` ruled rows led by the number. */
  variant?: StepsVariant
  /** `draw` lets the connecting line grow when a step completes. Only `horizontal` and `vertical` have one. */
  effect?: StepsEffect
  /** Makes finished steps links back. */
  onStepSelect?: (index: number) => void
  labels?: Partial<StepsLabels>
}

function Steps({ steps, current = 0, variant = "horizontal", effect, onStepSelect, labels, className, ...props }: StepsProps) {
  const List = LIST[variant]
  return (
    <nav data-slot="steps" data-variant={variant} data-effect={effect} className={cn("w-full min-w-0", className)} {...props}>
      <List
        steps={steps}
        current={current}
        draw={effect === "draw"}
        labels={{ ...DEFAULT_LABELS, ...labels }}
        onStepSelect={onStepSelect}
      />
    </nav>
  )
}

export { Steps, stepState, type StepsProps, type StepItem, type StepsVariant, type StepsEffect, type StepsLabels, type StepState }
