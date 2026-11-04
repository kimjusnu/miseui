import { cn } from "@/registry/miseui/lib/utils"
import { DEFAULT_COPY, ROOT_CLASS, SAMPLE_STATS, StatNumber, StatsHeading, StatsNote, resolveNote, type StatsSectionCopyProps } from "./stats-section-parts"

/** The first number is the one people should remember, so it gets the size and the soft accent, and the others stay in one quiet list. */
function StatsSectionPlate({
  headline = DEFAULT_COPY.headline,
  headlineQuiet = DEFAULT_COPY.headlineQuiet,
  stats = SAMPLE_STATS,
  note,
  locale,
  className,
  ...props
}: StatsSectionCopyProps) {
  const [lead, ...rest] = stats
  if (!lead) return null
  return (
    <section data-slot="stats-section" data-variant="plate" className={cn(ROOT_CLASS, "bg-muted dark:bg-background", className)} {...props}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 @2xl:px-8 @2xl:py-16">
        <StatsHeading headline={headline} quiet={headlineQuiet} className="max-w-2xl" />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-2 @3xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <dl data-slot="stats-section-lead" className="m-0 flex min-w-0 flex-col-reverse justify-between gap-12 rounded-3xl bg-mise-soft p-6 @3xl:p-8 dark:border dark:bg-card">
            <dt className="text-[15px] leading-relaxed text-pretty">{lead.label}</dt>
            <dd className="m-0">
              {/* Scales with the frame: a fixed size is either timid on a desktop or too wide on a phone. */}
              <StatNumber stat={lead} locale={locale} className="text-display text-[clamp(3rem,14cqi,4.5rem)]" />
            </dd>
          </dl>
          {rest.length > 0 ? (
            <dl className="m-0 flex min-w-0 flex-col justify-center divide-y rounded-3xl border bg-background px-6 dark:bg-card">
              {rest.map((stat) => (
                <div key={stat.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 py-6">
                  <dt className="min-w-0 text-[15px] leading-relaxed text-pretty text-muted-foreground">{stat.label}</dt>
                  <dd className="m-0">
                    <StatNumber stat={stat} locale={locale} className="text-title text-3xl" />
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
        <StatsNote note={resolveNote(note, stats)} />
      </div>
    </section>
  )
}

export { StatsSectionPlate }
