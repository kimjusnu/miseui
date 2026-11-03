import { Flow, type FlowEffect, type FlowStep, type FlowVariant } from "@/registry/miseui/ui/flow"

const STEPS: readonly FlowStep[] = [
  { title: "Request", tag: "Customer", detail: "A refund form arrives with the order number filled in.", arrow: "within an hour" },
  { title: "Check", tag: "Support", detail: "Support confirms the order and the return window.", arrow: "if it qualifies" },
  { title: "Approve", tag: "Finance", detail: "Amounts over 200 need a second pair of eyes.", arrow: "same day" },
  { title: "Refund", tag: "Finance", detail: "The money is back on the card within five working days." },
]

const SHOWN: ReadonlyArray<{ title: string; variant: FlowVariant; effect?: FlowEffect; wide?: boolean }> = [
  { title: "walkthrough", variant: "walkthrough", wide: true },
  { title: "chain, stacks when narrow", variant: "chain", wide: true },
  { title: "rail", variant: "rail" },
  { title: "inline", variant: "inline" },
  { title: "spring effect, the marker slides", variant: "walkthrough", effect: "spring", wide: true },
  { title: "sequence effect, in order the first time it is seen", variant: "chain", effect: "sequence", wide: true },
]

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {SHOWN.map(({ title, variant, effect, wide }) => (
        <div key={title} className={wide ? "grid min-w-0 content-start gap-2 sm:col-span-2" : "grid min-w-0 content-start gap-2"}>
          <p className="text-xs text-muted-foreground">{title}</p>
          <Flow label={`Refund process, ${title}`} steps={STEPS} variant={variant} effect={effect} />
        </div>
      ))}
    </div>
  )
}
