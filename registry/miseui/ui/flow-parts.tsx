import type * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { ArrowDown, ArrowRight, ChevronRight } from "lucide-react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

export interface FlowStep {
  title: string
  detail?: React.ReactNode
  /** A short line above the detail, such as who does this step. */
  tag?: string
  /** Words on the arrow to the next step, such as "if approved". */
  arrow?: string
}

export interface FlowListProps {
  steps: readonly FlowStep[]
  sequence: boolean
}

const STAGGER_S = 0.06
const RISE_PX = 8

/** Comes in once when first seen. The stagger is the order of the steps, so it says something a fade would not. */
function FlowItem({ sequence, index, className, children }: { sequence: boolean; index: number; className?: string; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion() ?? false
  if (!sequence || reduceMotion) return <li data-slot="flow-step" className={className}>{children}</li>
  return (
    <motion.li
      data-slot="flow-step"
      className={className}
      initial={{ opacity: 0, y: RISE_PX }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ ...SPRING_DEFAULT, delay: index * STAGGER_S }}
    >
      {children}
    </motion.li>
  )
}

function ArrowLabel({ children }: { children: React.ReactNode }) {
  return <span data-slot="flow-arrow-label" className="text-[13px] leading-tight text-muted-foreground">{children}</span>
}

export function FlowChain({ steps, sequence }: FlowListProps) {
  return (
    <ol data-slot="flow-list" className="flex min-w-0 flex-col @3xl:flex-row">
      {steps.map((step, index) => (
        <FlowItem key={step.title} sequence={sequence} index={index} className="flex min-w-0 flex-col @3xl:flex-1 @3xl:flex-row">
          <div className="grid min-w-0 content-start gap-1 rounded-lg border bg-card px-3 py-2 text-card-foreground @3xl:flex-1">
            {step.tag ? <p className="text-[13px] text-muted-foreground">{step.tag}</p> : null}
            <p className="text-sm font-medium">{step.title}</p>
            {step.detail ? <div className="text-[13px] leading-snug text-muted-foreground">{step.detail}</div> : null}
          </div>
          {index < steps.length - 1 ? (
            <span data-slot="flow-arrow" className="flex shrink-0 items-center gap-2 py-2 ps-3 text-muted-foreground @3xl:flex-col @3xl:justify-center @3xl:gap-1 @3xl:px-2 @3xl:py-0">
              <ArrowDown aria-hidden="true" className="size-4 @3xl:hidden" />
              <ArrowRight aria-hidden="true" className="hidden size-4 @3xl:block" />
              {/* Narrow on a row, so the words on an arrow do not take the width from the step they connect. */}
              {step.arrow ? <span className="@3xl:w-16 @3xl:text-center"><ArrowLabel>{step.arrow}</ArrowLabel></span> : null}
            </span>
          ) : null}
        </FlowItem>
      ))}
    </ol>
  )
}

export function FlowRail({ steps, sequence }: FlowListProps) {
  return (
    <ol data-slot="flow-list" className="grid min-w-0">
      {steps.map((step, index) => {
        const last = index === steps.length - 1
        return (
          <FlowItem key={step.title} sequence={sequence} index={index} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3">
            <div className="flex flex-col items-center">
              <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full border bg-background text-[13px] tabular-nums">
                {index + 1}
              </span>
              {last ? null : <span aria-hidden="true" data-slot="flow-arrow" className="w-px flex-1 bg-border" />}
            </div>
            <div className={cn("grid min-w-0 content-start gap-1", !last && "pb-6")}>
              <p className="text-sm leading-6 font-medium">{step.title}</p>
              {step.tag ? <p className="text-[13px] text-muted-foreground">{step.tag}</p> : null}
              {step.detail ? <div className="text-[13px] leading-snug text-muted-foreground">{step.detail}</div> : null}
              {step.arrow && !last ? (
                <span className="flex items-center gap-1 pt-1 text-muted-foreground">
                  <ArrowDown aria-hidden="true" className="size-3.5 shrink-0" />
                  <ArrowLabel>{step.arrow}</ArrowLabel>
                </span>
              ) : null}
            </div>
          </FlowItem>
        )
      })}
    </ol>
  )
}

export function FlowInline({ steps, sequence }: FlowListProps) {
  return (
    <ol data-slot="flow-list" className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1 text-[13px] text-muted-foreground">
      {steps.map((step, index) => {
        const last = index === steps.length - 1
        return (
          <FlowItem key={step.title} sequence={sequence} index={index} className="flex min-w-0 items-center gap-1">
            <span className="font-medium text-foreground">{step.title}</span>
            {/* No room to show the detail, but a screen reader has time for it. */}
            {step.detail ? <span className="sr-only">{step.detail}</span> : null}
            {/* The condition sits before the chevron, or it reads as part of the step after it. */}
            {step.arrow && !last ? <ArrowLabel>{step.arrow}</ArrowLabel> : null}
            {last ? null : <ChevronRight aria-hidden="true" data-slot="flow-arrow" className="size-3.5 shrink-0" />}
          </FlowItem>
        )
      })}
    </ol>
  )
}
