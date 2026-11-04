import { cn } from "@/registry/miseui/lib/utils"
import { DEFAULT_COPY, ROOT_CLASS, SAMPLE_STATS, StatNumber, StatsHeading, StatsNote, resolveNote, type StatsSectionCopyProps, type StatsSectionStat } from "./stats-section-parts"
import { StatsSectionPlate } from "./stats-section-plate"
import { StatsSectionSplit, type StatsSectionSplitProps } from "./stats-section-split"

type StatsSectionVariant = "row" | "plate" | "split"

interface StatsSectionProps extends StatsSectionSplitProps {
  /** `row` several numbers of equal weight, `plate` one number to remember above the rest, `split` each number beside what it counts. Anything else is `row`. */
  variant?: StatsSectionVariant
}

function StatsSectionRow({
  headline = DEFAULT_COPY.headline,
  headlineQuiet = DEFAULT_COPY.headlineQuiet,
  stats = SAMPLE_STATS,
  note,
  locale,
  className,
  ...props
}: StatsSectionCopyProps) {
  if (stats.length === 0) return null
  return (
    <section data-slot="stats-section" data-variant="row" className={cn(ROOT_CLASS, "bg-background", className)} {...props}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 @2xl:gap-12 @2xl:px-8 @2xl:py-16">
        <StatsHeading headline={headline} quiet={headlineQuiet} className="max-w-2xl" />
        {/* Auto-fit so three, four or five numbers all fill the line, and two columns remain at 343 px. */}
        <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-x-6 gap-y-8">
          {stats.map((stat) => (
            <div key={stat.id} className="flex min-w-0 flex-col-reverse justify-end gap-2 border-l pl-4">
              <dt className="text-[13px] leading-5 text-pretty text-muted-foreground">{stat.label}</dt>
              <dd className="m-0">
                <StatNumber stat={stat} locale={locale} className="text-title text-3xl @3xl:text-4xl" />
              </dd>
            </div>
          ))}
        </dl>
        <StatsNote note={resolveNote(note, stats)} />
      </div>
    </section>
  )
}

function StatsSection({ variant, description, ...props }: StatsSectionProps) {
  switch (variant) {
    case "plate":
      return <StatsSectionPlate {...props} />
    case "split":
      return <StatsSectionSplit description={description} {...props} />
    default:
      return <StatsSectionRow {...props} />
  }
}

export { StatsSection, type StatsSectionProps, type StatsSectionStat, type StatsSectionVariant }
