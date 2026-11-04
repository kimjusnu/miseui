import type * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Badge } from "@/registry/miseui/ui/badge"
import { Card } from "@/registry/miseui/ui/card"
import { DEFAULT_COPY, HeroActions, HeroHeading, type LandingHeroCopyProps } from "./landing-hero-copy"
import { ACTION_ITEMS } from "./landing-hero-parts"

const TRANSCRIPT_LINES = [
  { time: "14:02", speaker: "Priya", line: "I can get the revised tiers to sales by Thursday." },
  { time: "21:40", speaker: "Tomas", line: "I will draft the customer email. You will have it Monday." },
] as const

/** Black, because a shadow built from the ink turns into a glow in dark mode. */
const FRONT_SHADOW_CLASS =
  "shadow-[0_1px_2px_color-mix(in_oklab,var(--foreground)_6%,transparent),0_16px_32px_-16px_color-mix(in_oklab,var(--foreground)_16%,transparent)] dark:shadow-[0_16px_32px_-16px_black]"

/** The bottom padding is the part the front card lies over, so nothing readable gets cut off, at any width. */
function TranscriptFragment() {
  return (
    <Card aria-hidden="true" data-testid="fragment-back" className="gap-3 rounded-2xl p-4 pb-16 shadow-none @2xl:p-6 @2xl:pb-16">
      <div className="flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
        <span>Transcript</span>
        <span className="tabular-nums">38:12</span>
      </div>
      {TRANSCRIPT_LINES.map((entry) => (
        <p key={entry.time} className="text-[13px] leading-relaxed text-pretty text-muted-foreground">
          <span className="font-medium text-foreground">{entry.speaker}</span> {entry.line}
        </p>
      ))}
    </Card>
  )
}

function PlanFragment() {
  return (
    <Card aria-hidden="true" data-testid="fragment-front" className={cn("gap-3 rounded-2xl bg-background p-4 @2xl:p-6 dark:bg-muted", FRONT_SHADOW_CLASS)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[15px]">The plan</span>
        <Badge variant="mise">
          <Check />
          Sent to 5 people
        </Badge>
      </div>
      <ul className="flex flex-col divide-y border-t">
        {ACTION_ITEMS.map((item) => (
          <li key={item.owner} className="flex items-center gap-3 py-2 text-[13px] leading-relaxed">
            <span className="min-w-0 flex-1 text-pretty">{item.task}</span>
            <span className="shrink-0 text-muted-foreground">{item.owner}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function LandingHeroOverlap({
  headline = DEFAULT_COPY.headline,
  headlineQuiet = DEFAULT_COPY.headlineQuiet,
  description = DEFAULT_COPY.description,
  primaryAction = DEFAULT_COPY.primaryAction,
  secondaryAction = DEFAULT_COPY.secondaryAction,
  fragments = [<TranscriptFragment key="back" />, <PlanFragment key="front" />],
  className,
  ...props
}: LandingHeroCopyProps & { fragments?: readonly [React.ReactNode, React.ReactNode] }) {
  const [back, front] = fragments
  return (
    <section data-slot="landing-hero" data-variant="overlap" className={cn("@container w-full bg-muted dark:bg-background", className)} {...props}>
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 @4xl:grid-cols-2 @5xl:gap-16 @5xl:px-8">
        <div className="flex min-w-0 flex-col items-start gap-6">
          <HeroHeading headline={headline} quiet={headlineQuiet} className="@md:text-4xl @6xl:text-5xl" />
          <p className="max-w-md text-[15px] leading-relaxed text-pretty text-muted-foreground">{description}</p>
          <HeroActions primary={primaryAction} secondary={secondaryAction} />
        </div>
        <div data-testid="hero-fragments" className="flex min-w-0 flex-col">
          <div className="w-11/12 min-w-0 @4xl:w-5/6">{back}</div>
          <div className="relative z-10 -mt-12 ml-auto w-11/12 min-w-0 @4xl:w-5/6">{front}</div>
        </div>
      </div>
    </section>
  )
}

export { LandingHeroOverlap }
