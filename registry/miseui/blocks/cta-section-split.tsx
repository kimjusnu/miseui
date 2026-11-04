import type * as React from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { Badge } from "@/registry/miseui/ui/badge"
import { CtaActions, CtaHeading, CtaNote, DEFAULT_COPY, ROOT_CLASS, type CtaSectionCopyProps } from "./cta-section-parts"

const SAMPLE_ROWS = [
  { owner: "Priya", task: "Send the revised tiers to sales", due: "Thursday" },
  { owner: "Tomas", task: "Draft the customer email", due: "Monday" },
  { owner: "Wen", task: "Brief support on the change", due: "Friday" },
] as const

/** Sits on the bottom edge of the plate, so it reads as something coming out of the product and not a card floating beside the words. */
function CtaSampleFragment() {
  return (
    <figure data-slot="cta-section-fragment" className="m-0 rounded-t-2xl border border-b-0 bg-card dark:bg-muted">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <span className="text-[15px] leading-snug">Weekly pricing review</span>
        <Badge variant="secondary" className="font-normal">
          Sample
        </Badge>
      </figcaption>
      <ul className="flex flex-col divide-y">
        {SAMPLE_ROWS.map((row) => (
          <li key={row.owner} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 px-4 py-3 text-[13px] leading-5">
            <span className="min-w-0 text-pretty">
              <span className="font-medium">{row.owner}</span> <span className="text-muted-foreground">{row.task}</span>
            </span>
            <span className="whitespace-nowrap text-muted-foreground">{row.due}</span>
          </li>
        ))}
      </ul>
    </figure>
  )
}

interface CtaSectionSplitProps extends CtaSectionCopyProps {
  /** A piece of your real product. Null leaves the text alone on the plate. */
  fragment?: React.ReactNode
}

function CtaSectionSplit({
  headline = DEFAULT_COPY.headline,
  headlineQuiet = DEFAULT_COPY.headlineQuiet,
  description = DEFAULT_COPY.description,
  primaryAction = DEFAULT_COPY.primaryAction,
  secondaryAction = DEFAULT_COPY.secondaryAction,
  note = DEFAULT_COPY.note,
  fragment = <CtaSampleFragment />,
  className,
  ...props
}: CtaSectionSplitProps) {
  const hasFragment = fragment !== null
  return (
    <section data-slot="cta-section" data-variant="split" className={cn(ROOT_CLASS, className)} {...props}>
      <div className="mx-auto w-full max-w-6xl px-4 py-12 @2xl:px-8 @2xl:py-16">
        <div className={cn("grid grid-cols-[minmax(0,1fr)] rounded-3xl border bg-background dark:bg-card", hasFragment && "@4xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]")}>
          <div className="flex min-w-0 flex-col items-start gap-6 p-6 @2xl:p-12">
            <CtaHeading headline={headline} quiet={headlineQuiet} className="@2xl:text-4xl" />
            <p className="max-w-md text-[15px] leading-relaxed text-pretty text-muted-foreground">{description}</p>
            <CtaActions primary={primaryAction} secondary={secondaryAction} />
            <CtaNote note={note} />
          </div>
          {hasFragment ? <div className="flex min-w-0 flex-col justify-end px-6 @2xl:px-12 @4xl:pt-12 @4xl:pr-12 @4xl:pl-0">{fragment}</div> : null}
        </div>
      </div>
    </section>
  )
}

export { CtaSectionSplit, type CtaSectionSplitProps }
