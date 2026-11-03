import type * as React from "react"
import { useId, useState } from "react"
import { ChevronDown } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { DecisionBody, ROOT_CLASS, ROW_CLASS, type DecisionCardsVariant, type DecisionItem, type DecisionLabels } from "@/registry/miseui/ui/decision-cards-parts"
import { cn } from "@/registry/miseui/lib/utils"

type DecisionCardsEffect = "disclose"

const DEFAULT_LABELS: DecisionLabels = { chosen: "Chose", rejected: "Passed on", reason: "Why", over: "over" }
const INSTANT = { duration: 0 } as const

function HiddenReason({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const reduceMotion = useReducedMotion() ?? false
  const panelId = useId()
  return (
    <div className="mt-2 grid grid-cols-[minmax(0,1fr)]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        data-slot="decision-cards-toggle"
        onClick={() => setOpen(!open)}
        className="-ms-1 flex h-8 w-fit items-center gap-1 rounded-sm px-1 text-[13px] text-muted-foreground outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:h-10"
      >
        {label}
        <ChevronDown aria-hidden="true" className={cn("size-4 transition-transform duration-(--duration-base) ease-(--ease-mise) motion-reduce:transition-none", open && "rotate-180")} />
      </button>
      {/* Stays mounted so the spring can run both ways, so inert is what keeps a closed reason away from assistive tech. */}
      <motion.div
        id={panelId}
        data-slot="decision-cards-reason"
        inert={!open}
        className="overflow-hidden"
        initial={false}
        animate={{ height: open ? "auto" : 0 }}
        transition={reduceMotion ? INSTANT : SPRING_DEFAULT}
      >
        <p className="pt-1 text-[13px] leading-5 text-pretty text-muted-foreground">{children}</p>
      </motion.div>
    </div>
  )
}

function ShownReason({ variant, children }: { variant: DecisionCardsVariant; children: React.ReactNode }) {
  return (
    <p data-slot="decision-cards-reason" className={cn("text-pretty", variant === "ledger" ? "text-[13px] leading-5 text-muted-foreground" : "mt-3 text-sm leading-6", variant === "diff" && "text-muted-foreground")}>
      {children}
    </p>
  )
}

type DecisionCardsProps = Omit<React.ComponentProps<"ol">, "children"> & {
  items: readonly DecisionItem[]
  /** `split` two boxes side by side, `diff` struck out and written in like an edit, `ledger` a compact record per row. */
  variant?: DecisionCardsVariant
  /** `disclose` folds each reason behind a button, so a long list can be scanned by outcome first. */
  effect?: DecisionCardsEffect
  /** The words around the values, for another language or another tone. */
  labels?: Partial<DecisionLabels>
}

function DecisionCards({ items, variant = "split", effect, labels, className, ...props }: DecisionCardsProps) {
  const words = { ...DEFAULT_LABELS, ...labels }
  return (
    <ol data-slot="decision-cards" data-variant={variant} data-effect={effect} className={cn(ROOT_CLASS[variant], className)} {...props}>
      {items.map((item, index) => (
        <li key={item.id ?? item.title} data-slot="decision-cards-item" className={ROW_CLASS[variant]}>
          <DecisionBody item={item} index={index} variant={variant} labels={words} />
          {effect === "disclose" ? <HiddenReason label={words.reason}>{item.reason}</HiddenReason> : <ShownReason variant={variant}>{item.reason}</ShownReason>}
        </li>
      ))}
    </ol>
  )
}

export { DecisionCards, type DecisionCardsProps, type DecisionCardsVariant, type DecisionCardsEffect, type DecisionItem, type DecisionLabels }
