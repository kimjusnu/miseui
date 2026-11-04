import { useRef, useState } from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { Chart } from "@/registry/miseui/ui/chart"
import { useElementWidth } from "@/registry/miseui/ui/chart-state"
import { Skeleton } from "@/registry/miseui/ui/skeleton"
import { ActivityList, AttentionItem, ChangeLabel, PANEL_CLASS, type DashboardActivity, type DashboardAttention, type DashboardMetric } from "./dashboard-overview-parts"

const MAX_METRICS = 4
const FALLBACK_WIDTH_PX = 640
/** Below this width a tall plot is mostly empty scrolling, and the strip above it already took the first screen. */
const TALL_FROM_PX = 560
const SHORT_HEIGHT_PX = 240
const TALL_HEIGHT_PX = 384
const STRIP_CLASS = "grid grid-cols-2 gap-1 @3xl:grid-cols-4"
const plainFormat = (value: number) => value.toLocaleString("en-US")

interface MetricTileProps {
  metric: DashboardMetric
  active: boolean
  onChoose?: () => void
}

/** A metric with nothing to draw stays a plain figure: a button that changes nothing is a lie. */
function MetricTile({ metric, active, onChoose }: MetricTileProps) {
  const content = (
    <>
      <span className="block text-[13px] text-pretty text-muted-foreground">{metric.label}</span>
      <span className="text-title mt-1 block text-xl @2xl:text-2xl">{metric.value}</span>
    </>
  )
  if (!onChoose) return <div className="min-w-0 rounded-xl p-3">{content}</div>
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onChoose}
      className={cn(
        "min-w-0 rounded-xl p-3 text-start outline-none",
        "transition-colors duration-(--duration-fast) ease-(--ease-mise)",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50",
        active ? "bg-muted dark:bg-accent" : "hover:bg-muted/60 dark:hover:bg-accent/60",
      )}
    >
      {content}
    </button>
  )
}

function useChosenMetric(metrics: readonly DashboardMetric[]) {
  const [chosenId, setChosenId] = useState<string | null>(null)
  const drawable = (metric: DashboardMetric) => (metric.series?.length ?? 0) > 0
  // A range or data change can take the chosen metric away, so this falls back instead of drawing nothing.
  const current = metrics.find((metric) => metric.id === chosenId && drawable(metric)) ?? metrics.find(drawable) ?? metrics[0]
  return { current, choose: setChosenId, drawable }
}

function LargeChart({ metric }: { metric: DashboardMetric }) {
  const frame = useRef<HTMLDivElement>(null)
  const width = useElementWidth(frame, FALLBACK_WIDTH_PX)
  const data = (metric.series ?? []).map((point) => ({ day: point.label, value: point.value }))
  return (
    <div ref={frame} className="min-w-0">
      {/* A line, because the kit's area scale starts at zero, which flattens a slowly moving total into a shelf. */}
      <Chart
        key={metric.id}
        variant="line"
        label={metric.label}
        data={data}
        index="day"
        series={[{ key: "value", label: metric.label }]}
        height={width < TALL_FROM_PX ? SHORT_HEIGHT_PX : TALL_HEIGHT_PX}
        formatValue={metric.formatPoint ?? plainFormat}
      />
    </div>
  )
}

interface AnalyticsBodyProps {
  metrics: readonly DashboardMetric[]
  activity: readonly DashboardActivity[]
  attention?: DashboardAttention
}

function AnalyticsBody({ metrics, activity, attention }: AnalyticsBodyProps) {
  const shown = metrics.slice(0, MAX_METRICS)
  const { current, choose, drawable } = useChosenMetric(shown)
  return (
    <div className="flex min-w-0 flex-col gap-4 pointer-coarse:[&_[data-slot=button]]:h-10">
      <section aria-label="Trend" className={cn(PANEL_CLASS, "flex flex-col gap-4 p-2 @md:p-4")}>
        <div role="group" aria-label="Metric on the chart" className={STRIP_CLASS}>
          {shown.map((metric) => (
            <MetricTile key={metric.id} metric={metric} active={metric.id === current.id} onChoose={drawable(metric) ? () => choose(metric.id) : undefined} />
          ))}
        </div>
        <div className="flex flex-col gap-3 px-2 pb-2 @md:px-2">
          <ChangeLabel metric={current} className="text-[13px]" />
          <LargeChart metric={current} />
        </div>
      </section>
      <div className="flex min-w-0 flex-col gap-4 @3xl:flex-row @3xl:items-start">
        {/* empty: the item can be put off, and a column reserved for it would stay behind as a blank. */}
        {attention ? (
          <div className="min-w-0 empty:hidden @3xl:order-last @3xl:w-80 @3xl:shrink-0">
            <AttentionItem key={attention.title} attention={attention} />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <ActivityList activity={activity} />
        </div>
      </div>
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div role="status" aria-label="Loading dashboard" className="flex flex-col gap-4">
      <div className={cn(PANEL_CLASS, "flex flex-col gap-4 p-2 @md:p-4")}>
        <div className={STRIP_CLASS}>
          {Array.from({ length: MAX_METRICS }, (_, index) => (
            <div key={index} className="flex flex-col gap-2 p-3">
              <Skeleton effect="wave" className="h-4 w-24" />
              <Skeleton effect="wave" className="h-6 w-20" />
            </div>
          ))}
        </div>
        <Skeleton effect="wave" className="mx-2 mb-2 h-60 rounded-xl @2xl:h-96" />
      </div>
      <div className={cn(PANEL_CLASS, "p-4")}>
        <Skeleton effect="wave" className="h-40 w-full" />
      </div>
    </div>
  )
}

export { AnalyticsBody, AnalyticsSkeleton }
