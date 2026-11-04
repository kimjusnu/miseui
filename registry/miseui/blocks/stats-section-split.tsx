import { cn } from "@/registry/miseui/lib/utils"
import { DEFAULT_COPY, ROOT_CLASS, SAMPLE_STATS, StatNumber, StatsHeading, StatsNote, resolveNote, type StatsSectionCopyProps } from "./stats-section-parts"

interface StatsSectionSplitProps extends StatsSectionCopyProps {
  /** One or two sentences beside the numbers, on `split`. */
  description?: string
}

/** A number without context is only a claim, so each one sits beside what it counts and where it comes from. */
function StatsSectionSplit({
  headline = DEFAULT_COPY.headline,
  headlineQuiet = DEFAULT_COPY.headlineQuiet,
  description = "Every call ends with a written plan, so nobody has to take notes or ask who owns what.",
  stats = SAMPLE_STATS,
  note,
  locale,
  className,
  ...props
}: StatsSectionSplitProps) {
  if (stats.length === 0) return null
  return (
    <section data-slot="stats-section" data-variant="split" className={cn(ROOT_CLASS, "bg-background", className)} {...props}>
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] items-start gap-8 px-4 py-12 @2xl:px-8 @2xl:py-16 @4xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @4xl:gap-16">
        <div className="flex min-w-0 flex-col gap-6">
          <StatsHeading headline={headline} quiet={headlineQuiet} className="@2xl:text-3xl" />
          <p className="max-w-md text-[15px] leading-relaxed text-pretty text-muted-foreground">{description}</p>
          <StatsNote note={resolveNote(note, stats)} />
        </div>
        <dl className="m-0 flex min-w-0 flex-col divide-y border-y">
          {stats.map((stat) => (
            <div key={stat.id} className="grid grid-cols-[minmax(0,1fr)] gap-x-6 gap-y-1 py-6 @lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <dt className="text-[15px] leading-relaxed text-pretty @lg:col-start-2">{stat.label}</dt>
              {/* First on screen and second in the markup: a screen reader hears what is counted before the number. */}
              <dd className="m-0 -order-1 @lg:col-start-1 @lg:row-span-2 @lg:row-start-1">
                <StatNumber stat={stat} locale={locale} className="text-title text-4xl" />
              </dd>
              {stat.detail ? <dd className="m-0 text-[13px] leading-5 text-pretty text-muted-foreground @lg:col-start-2">{stat.detail}</dd> : null}
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export { StatsSectionSplit, type StatsSectionSplitProps }
