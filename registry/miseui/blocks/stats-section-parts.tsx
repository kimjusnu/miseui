import type * as React from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { CountUp } from "@/registry/miseui/ui/count-up"

interface StatsSectionStat {
  id: string
  value: number
  label: string
  prefix?: string
  suffix?: string
  formatOptions?: Intl.NumberFormatOptions
  /** Where the number comes from, or what it counts. Shown on `split`. */
  detail?: string
}

interface StatsSectionCopyProps extends React.ComponentProps<"section"> {
  headline?: string
  /** Continues the headline in the same size, one tone quieter. */
  headlineQuiet?: string
  /** Only numbers you can back up. An empty list renders nothing. */
  stats?: readonly StatsSectionStat[]
  /** A line under the numbers. Defaults to saying the sample figures are examples, and to nothing once you pass your own. */
  note?: string | null
  /** Leave unset to follow the viewer. A server-rendered page should pass one. */
  locale?: Intl.LocalesArgument
}

const SAMPLE_STATS: readonly StatsSectionStat[] = [
  { id: "calls", value: 1240, label: "Calls summarized this week", detail: "Counted when the summary is sent, not when the call starts." },
  { id: "owners", value: 94, suffix: "%", label: "Action items with an owner", detail: "The rest are flagged, so someone can claim them." },
  { id: "saved", value: 6.5, suffix: " h", label: "Saved per person each month", detail: "From the time people told us they spent writing notes." },
  { id: "speed", value: 2, suffix: " min", label: "From hang-up to summary", detail: "The median for a call of one hour." },
]

const SAMPLE_NOTE = "Example figures for a sample product. Replace them with your own."

const DEFAULT_COPY = {
  headline: "Less time writing it down.",
  headlineQuiet: "More time doing it.",
} as const

const ROOT_CLASS = "@container flex w-full flex-col justify-center"

/** The example note must not outlive the example numbers, or it would call a real figure made up. */
function resolveNote(note: string | null | undefined, stats: readonly StatsSectionStat[]) {
  if (note !== undefined) return note
  return stats === SAMPLE_STATS ? SAMPLE_NOTE : null
}

function StatNumber({ stat, locale, className }: { stat: StatsSectionStat; locale?: Intl.LocalesArgument; className?: string }) {
  return <CountUp value={stat.value} prefix={stat.prefix} suffix={stat.suffix} formatOptions={stat.formatOptions} locale={locale} className={className} />
}

function StatsHeading({ headline, quiet, className }: { headline: string; quiet: string; className?: string }) {
  return (
    <h2 className={cn("text-title text-3xl text-balance @2xl:text-4xl", className)}>
      {headline} <span className="text-muted-foreground">{quiet}</span>
    </h2>
  )
}

function StatsNote({ note, className }: { note: string | null; className?: string }) {
  if (!note) return null
  return <p className={cn("text-[13px] leading-5 text-pretty text-muted-foreground", className)}>{note}</p>
}

export { DEFAULT_COPY, ROOT_CLASS, SAMPLE_STATS, StatNumber, StatsHeading, StatsNote, resolveNote, type StatsSectionCopyProps, type StatsSectionStat }
