import { useId, useMemo, useRef } from "react"
import { SectionIndex, type SectionIndexEffect, type SectionIndexVariant } from "@/registry/miseui/ui/section-index"

const CHAPTERS = [
  {
    key: "problem",
    title: "The problem",
    body: "Half of new teams never invited a second person. They signed up, looked around alone and left within the week, without once seeing what the product was for.",
  },
  {
    key: "approach",
    title: "The approach",
    body: "We moved the invite into the first screen and wrote the empty board as a question to a colleague. Nothing else changed, so any difference could only come from this.",
  },
  {
    key: "result",
    title: "The result",
    body: "Two out of three teams now invite someone on the first day. Support asks fewer questions about permissions too, because people learn them from each other.",
  },
  {
    key: "next",
    title: "What comes next",
    body: "The same idea for the second week: a board that asks who is missing.",
  },
] as const

function Reading({ label, variant, effect }: { label: string; variant?: SectionIndexVariant; effect?: SectionIndexEffect }) {
  const prefix = useId()
  const scrollRef = useRef<HTMLDivElement>(null)
  const items = useMemo(() => CHAPTERS.map(({ key, title }) => ({ id: `${prefix}${key}`, title })), [prefix])
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <SectionIndex items={items} variant={variant} effect={effect} scrollRef={scrollRef} scrollOffset={8} label={`Case study, ${label}`} />
      <div ref={scrollRef} tabIndex={0} role="region" aria-label={`Case study text, ${label}`} className="h-40 overflow-y-auto rounded-md border bg-background p-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
        {CHAPTERS.map(({ key, title, body }) => (
          <section key={key} id={`${prefix}${key}`} className="pb-4 outline-none last:pb-0">
            <h3 className="text-sm font-medium">{title}</h3>
            <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{body}</p>
          </section>
        ))}
      </div>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Reading label="rail" />
      <Reading label="strip" variant="strip" />
      <Reading label="counter" variant="counter" />
      <Reading label="progress effect, rail" effect="progress" />
      <Reading label="progress effect, strip" variant="strip" effect="progress" />
      <Reading label="progress effect, counter" variant="counter" effect="progress" />
    </div>
  )
}
