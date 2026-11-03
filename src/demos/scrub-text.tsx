import { useRef } from "react"
import { ScrubText, type ScrubTextEffect, type ScrubTextVariant } from "@/registry/miseui/ui/scrub-text"

const STATEMENT = "Most support tickets are not bugs. They are a sentence on a screen that nobody read twice before it shipped."

interface PanelProps {
  label: string
  variant: ScrubTextVariant
  effect?: ScrubTextEffect
}

function Panel({ label, variant, effect }: PanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div
        ref={scrollRef}
        tabIndex={0}
        role="region"
        aria-label={`Scrolling example, ${label}`}
        className="relative h-48 overflow-y-auto rounded-md border bg-background px-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <p className="pt-4 pb-16 text-[13px] leading-5 text-muted-foreground">Scroll inside this box.</p>
        <ScrubText text={STATEMENT} variant={variant} effect={effect} scrollRef={scrollRef} />
        <p className="pt-16 pb-24 text-[13px] leading-5 text-muted-foreground">That is the whole statement. Scroll back and it reverses.</p>
      </div>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Panel label="words" variant="words" />
      <Panel label="marker" variant="marker" />
      <Panel label="rise" variant="rise" />
      <Panel label="smooth effect, words" variant="words" effect="smooth" />
    </div>
  )
}
