import type * as React from "react"
import { useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Badge } from "@/registry/miseui/ui/badge"
import { DEFAULT_COPY, HeroActions, HeroHeading, type LandingHeroCopyProps } from "./landing-hero-copy"
import { ACTION_ITEMS, SUMMARY } from "./landing-hero-parts"

type OwnerName = (typeof ACTION_ITEMS)[number]["owner"]

const TRANSCRIPT: ReadonlyArray<{ time: string; speaker: string; line: string; owner?: OwnerName }> = [
  { time: "08:26", speaker: "Ada", line: "Almost nobody is left on the $9 tier." },
  { time: "14:02", speaker: "Priya", line: "I can get the revised tiers to sales by Thursday.", owner: "Priya" },
  { time: "21:40", speaker: "Tomas", line: "I will draft the customer email. You will have it Monday.", owner: "Tomas" },
  { time: "33:15", speaker: "Wen", line: "Support needs a heads-up first. I will brief them by the 18th.", owner: "Wen" },
]

function TaskList({ owner, onSelect }: { owner: OwnerName; onSelect: (owner: OwnerName) => void }) {
  return (
    <ul className="flex flex-col gap-1">
      {ACTION_ITEMS.map((item) => (
        <li key={item.owner}>
          <button
            type="button"
            aria-pressed={item.owner === owner}
            onClick={() => onSelect(item.owner)}
            className={cn(
              "flex min-h-10 w-full items-center gap-3 rounded-lg px-2 py-2 text-start text-[13px] leading-relaxed outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50",
              item.owner === owner && "bg-accent",
            )}
          >
            <Badge variant="secondary" className="font-normal">
              {item.owner}
            </Badge>
            <span className="min-w-0 flex-1 text-pretty">{item.task}</span>
            <span className="shrink-0 text-muted-foreground">{item.due}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function TranscriptList({ owner }: { owner: OwnerName }) {
  return (
    <ol aria-label="Where each task was said" className="flex flex-col gap-1 border-t p-4 @2xl:p-6 @3xl:border-t-0 @3xl:border-l">
      {TRANSCRIPT.map((entry) => (
        <li
          key={entry.time}
          data-said={entry.owner === owner ? "true" : undefined}
          className={cn(
            "rounded-lg px-2 py-2 text-[13px] leading-relaxed text-pretty transition-colors duration-(--duration-fast) ease-(--ease-mise)",
            entry.owner === owner ? "bg-mise-soft" : "text-muted-foreground",
          )}
        >
          <span className="font-medium tabular-nums">{entry.time}</span> {entry.speaker}: {entry.line}
        </li>
      ))}
    </ol>
  )
}

/** Wide on purpose: the summary and the words it came from sit side by side, which a narrow card cannot show. */
function LandingHeroPlate() {
  const [owner, setOwner] = useState<OwnerName>(ACTION_ITEMS[0].owner)
  return (
    <div data-slot="landing-hero-plate" className="w-full max-w-5xl rounded-2xl border bg-background text-start dark:bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 @2xl:px-6">
        <div className="min-w-0 leading-relaxed">
          <p className="text-[15px]">Weekly pricing review</p>
          <p className="text-[13px] text-muted-foreground">38 min call, 5 people</p>
        </div>
        <Badge variant="outline" className="gap-2 px-3 py-1 text-[13px] font-normal">
          <Check />
          Sent to 5 people
        </Badge>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] @3xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-4 p-4 @2xl:p-6">
          <p className="text-[15px] leading-relaxed text-pretty">{SUMMARY}</p>
          <TaskList owner={owner} onSelect={setOwner} />
        </div>
        <TranscriptList owner={owner} />
      </div>
    </div>
  )
}

function LandingHeroCentered({
  headline = DEFAULT_COPY.headline,
  headlineQuiet = DEFAULT_COPY.headlineQuiet,
  description = DEFAULT_COPY.description,
  primaryAction = DEFAULT_COPY.primaryAction,
  secondaryAction = DEFAULT_COPY.secondaryAction,
  preview = <LandingHeroPlate />,
  className,
  ...props
}: LandingHeroCopyProps & { preview?: React.ReactNode }) {
  return (
    <section data-slot="landing-hero" data-variant="centered" className={cn("@container w-full bg-muted dark:bg-background", className)} {...props}>
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 px-4 py-16 @md:px-6 @5xl:px-8">
        <div className="flex max-w-2xl min-w-0 flex-col items-center gap-6 text-center">
          <HeroHeading headline={headline} quiet={headlineQuiet} className="@md:text-4xl @4xl:text-5xl" />
          <p className="max-w-md text-[15px] leading-relaxed text-pretty text-muted-foreground">{description}</p>
          <HeroActions primary={primaryAction} secondary={secondaryAction} className="justify-center" />
        </div>
        {preview !== null ? <div className="flex w-full min-w-0 justify-center">{preview}</div> : null}
      </div>
    </section>
  )
}

export { LandingHeroCentered }
