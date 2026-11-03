import type * as React from "react"
import { Fragment, useId, useState } from "react"
import { Tabs as TabsPrimitive } from "radix-ui"
import { LayoutGroup, motion, useReducedMotion } from "motion/react"
import { ArrowRight } from "lucide-react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { FlowChain, FlowInline, FlowRail, type FlowStep } from "@/registry/miseui/ui/flow-parts"
import { cn } from "@/registry/miseui/lib/utils"

type FlowVariant = "walkthrough" | "chain" | "rail" | "inline"
type FlowEffect = "spring" | "sequence"

type RootAttributes = Omit<React.ComponentProps<"figure">, "children">

interface FlowProps extends RootAttributes {
  /** Names the steps for assistive tech. */
  label: string
  steps: readonly FlowStep[]
  /** `walkthrough` one step at a time, `chain` boxes and arrows that wrap, `rail` a numbered column, `inline` a line for inside a sentence or a cell. */
  variant?: FlowVariant
  /** `spring` slides the walkthrough's marker between steps; `sequence` brings the other variants in, in order, the first time they are seen. */
  effect?: FlowEffect
  /** The step a walkthrough is on. */
  active?: number
  defaultActive?: number
  onActiveChange?: (index: number) => void
  caption?: React.ReactNode
}

const TAB_CLASS = [
  "relative inline-flex min-h-10 min-w-0 items-center gap-2 rounded-full px-3 py-1 text-start text-sm text-muted-foreground outline-none",
  "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:text-foreground",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=active]:text-foreground",
]

interface WalkthroughProps {
  label: string
  steps: readonly FlowStep[]
  spring: boolean
  active: number
  onChange: (index: number) => void
}

function FlowPanel({ step, selected, spring }: { step: FlowStep; selected: boolean; spring: boolean }) {
  return (
    <motion.div className="grid min-w-0 gap-1" initial={false} animate={{ opacity: selected ? 1 : 0 }} transition={spring ? SPRING_DEFAULT : { duration: 0 }}>
      {step.tag ? <p className="text-[13px] text-muted-foreground">{step.tag}</p> : null}
      {step.detail ? <div className="text-sm leading-relaxed">{step.detail}</div> : null}
      {step.arrow ? (
        <p className="flex items-center gap-1 pt-1 text-[13px] text-muted-foreground">
          <ArrowRight aria-hidden="true" className="size-3.5 shrink-0" />
          {step.arrow}
        </p>
      ) : null}
    </motion.div>
  )
}

function FlowWalkthrough({ label, steps, spring, active, onChange }: WalkthroughProps) {
  const groupId = useId()
  return (
    <LayoutGroup id={groupId}>
      <TabsPrimitive.Root value={String(active)} onValueChange={(next) => onChange(Number(next))} className="grid min-w-0 gap-4">
        <TabsPrimitive.List aria-label={label} className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-2">
          {steps.map((step, index) => (
            <Fragment key={step.title}>
              <TabsPrimitive.Trigger value={String(index)} className={cn(TAB_CLASS, !spring && "data-[state=active]:bg-muted")}>
                {spring && index === active ? (
                  <motion.span layoutId="flow-marker" data-slot="flow-marker" className="absolute inset-0 rounded-full bg-muted" transition={SPRING_DEFAULT} />
                ) : null}
                <span aria-hidden="true" className="relative text-[13px] tabular-nums">{index + 1}</span>
                <span className="relative min-w-0">{step.title}</span>
              </TabsPrimitive.Trigger>
              {index < steps.length - 1 ? <span aria-hidden="true" data-slot="flow-arrow" className="h-px w-3 shrink-0 bg-border @max-sm:hidden" /> : null}
            </Fragment>
          ))}
        </TabsPrimitive.List>
        {/* Every panel keeps its place in one grid cell, so the frame takes the tallest and the page does not jump between steps. */}
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] [&>*]:[grid-area:1/1]">
          {steps.map((step, index) => (
            <TabsPrimitive.Content
              key={step.title}
              value={String(index)}
              forceMount
              tabIndex={index === active ? 0 : -1}
              className="min-w-0 rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=inactive]:invisible"
            >
              <FlowPanel step={step} selected={index === active} spring={spring} />
            </TabsPrimitive.Content>
          ))}
        </div>
      </TabsPrimitive.Root>
    </LayoutGroup>
  )
}

const LISTS = { chain: FlowChain, rail: FlowRail, inline: FlowInline } as const

function Flow({
  label, steps, variant = "walkthrough", effect, active, defaultActive = 0, onActiveChange, caption, className, ...props
}: FlowProps) {
  const reduceMotion = useReducedMotion() ?? false
  const [uncontrolled, setUncontrolled] = useState(defaultActive)
  const current = Math.min(Math.max(active ?? uncontrolled, 0), Math.max(steps.length - 1, 0))
  const onChange = (next: number) => {
    setUncontrolled(next)
    onActiveChange?.(next)
  }
  let body: React.ReactNode
  if (variant === "walkthrough") {
    body = <FlowWalkthrough label={label} steps={steps} spring={effect === "spring" && !reduceMotion} active={current} onChange={onChange} />
  } else {
    const List = LISTS[variant]
    body = <List steps={steps} sequence={effect === "sequence"} />
  }
  return (
    <figure
      aria-label={variant === "walkthrough" ? undefined : label}
      data-slot="flow"
      data-variant={variant}
      data-effect={effect}
      className={cn("@container grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-3", className)}
      {...props}
    >
      {body}
      {caption ? <figcaption className="text-[13px] text-muted-foreground">{caption}</figcaption> : null}
    </figure>
  )
}

export { Flow, type FlowProps, type FlowStep, type FlowVariant, type FlowEffect }
