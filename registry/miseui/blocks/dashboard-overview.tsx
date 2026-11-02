import type * as React from "react"
import { useState } from "react"
import { ChartLine, LayoutDashboard, ReceiptText, Settings, Users } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/miseui/ui/tabs"
import { AreaChart } from "./dashboard-overview-chart"
import {
  ActivityList,
  AttentionItem,
  ChangeLabel,
  DashboardRail,
  PANEL_CLASS,
  SecondaryMetrics,
  type DashboardActivity,
  type DashboardAttention,
  type DashboardMetric,
  type DashboardNavItem,
  type DashboardRange,
} from "./dashboard-overview-parts"
import { DashboardMessage, DashboardSkeleton } from "./dashboard-overview-states"
import { SAMPLE_ACTIVITY, SAMPLE_ATTENTION, SAMPLE_METRICS } from "./dashboard-overview-sample"

const DEFAULT_NAV: readonly DashboardNavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "customers", label: "Customers", icon: Users },
  { id: "invoices", label: "Invoices", icon: ReceiptText },
  { id: "reports", label: "Reports", icon: ChartLine },
  { id: "settings", label: "Settings", icon: Settings },
]

const RANGE_LABELS: Readonly<Record<DashboardRange, string>> = { "7d": "7 days", "30d": "30 days", "90d": "90 days" }
const RANGES = Object.keys(RANGE_LABELS) as DashboardRange[]
/** One number first means the row under it stays short. A fourth metric belongs on its own page. */
const MAX_SECONDARY = 3

interface DashboardOverviewProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** The first is the number the page is about; up to three more sit in a quieter row. An empty list shows the empty state. */
  metrics?: readonly DashboardMetric[]
  activity?: readonly DashboardActivity[]
  /** One thing that needs a person. Leave it out when nothing does. */
  attention?: DashboardAttention
  /** Shows the loading skeleton and locks the date range. */
  pending?: boolean
  /** Replaces the numbers with this message and a way to retry. */
  error?: string
  onRetry?: () => void
  range?: DashboardRange
  defaultRange?: DashboardRange
  onRangeChange?: (range: DashboardRange) => void
  product?: string
  nav?: readonly DashboardNavItem[]
  onNavigate?: (id: string) => void
  emptyActionLabel?: string
  onEmptyAction?: () => void
}

function DashboardBody({ metrics, activity, attention }: Required<Pick<DashboardOverviewProps, "metrics" | "activity">> & Pick<DashboardOverviewProps, "attention">) {
  const [primary, ...rest] = metrics
  return (
    <div className="grid gap-4 @5xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-4">
        <section className={cn(PANEL_CLASS, "flex flex-col gap-6 p-4 @md:p-6")}>
          <div className="flex flex-col gap-2">
            <p className="text-[13px] text-muted-foreground">{primary.label}</p>
            <p className="text-display text-5xl @2xl:text-6xl">{primary.value}</p>
            <ChangeLabel metric={primary} className="text-[15px]" />
          </div>
          <AreaChart label={primary.label} points={primary.series ?? []} format={primary.formatPoint} />
        </section>
        <SecondaryMetrics metrics={rest.slice(0, MAX_SECONDARY)} />
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        {attention ? <AttentionItem key={attention.title} attention={attention} /> : null}
        <ActivityList activity={activity} />
      </div>
    </div>
  )
}

interface DashboardContentProps
  extends Pick<DashboardOverviewProps, "pending" | "error" | "onRetry" | "attention" | "emptyActionLabel" | "onEmptyAction"> {
  metrics: readonly DashboardMetric[]
  activity: readonly DashboardActivity[]
}

function DashboardContent({ pending, error, onRetry, metrics, activity, attention, emptyActionLabel, onEmptyAction }: DashboardContentProps) {
  if (pending) return <DashboardSkeleton />
  if (error) {
    return (
      <DashboardMessage
        role="alert"
        title="These numbers did not load"
        description={error}
        action={<Button variant="outline" onClick={onRetry}>Try again</Button>}
      />
    )
  }
  if (metrics.length === 0) {
    return (
      <DashboardMessage
        title="No numbers to show yet"
        description="Connect a billing account and your revenue appears here within a few minutes."
        action={<Button variant="mise" onClick={onEmptyAction}>{emptyActionLabel}</Button>}
      />
    )
  }
  return <DashboardBody metrics={metrics} activity={activity} attention={attention} />
}

function RangeHeader({ range, pending }: { range: DashboardRange; pending: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-title text-xl">
        Overview. <span className="text-muted-foreground">Last {RANGE_LABELS[range]}.</span>
      </h2>
      <TabsList aria-label="Date range">
        {RANGES.map((value) => (
          <TabsTrigger key={value} value={value} disabled={pending} className="px-3">
            {RANGE_LABELS[value]}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  )
}

function useRange(range: DashboardRange | undefined, defaultRange: DashboardRange, onChange?: (range: DashboardRange) => void) {
  const [internal, setInternal] = useState(defaultRange)
  const select = (next: string) => {
    setInternal(next as DashboardRange)
    onChange?.(next as DashboardRange)
  }
  return [range ?? internal, select] as const
}

function DashboardOverview({
  metrics,
  activity,
  attention,
  pending = false,
  error,
  onRetry,
  range,
  defaultRange = "30d",
  onRangeChange,
  product = "Tallyroom",
  nav = DEFAULT_NAV,
  onNavigate,
  emptyActionLabel = "Connect billing",
  onEmptyAction,
  className,
  ...props
}: DashboardOverviewProps) {
  const [currentRange, selectRange] = useRange(range, defaultRange, onRangeChange)

  return (
    <div data-slot="dashboard-overview" className={cn("@container w-full bg-muted", className)} {...props}>
      <div className="flex min-w-0 flex-col @3xl:flex-row">
        <DashboardRail product={product} nav={nav} onNavigate={onNavigate} />
        <Tabs value={currentRange} onValueChange={selectRange} className="min-w-0 flex-1 gap-6 p-4 @md:p-6 @3xl:p-8">
          <RangeHeader range={currentRange} pending={pending} />
          {/* Not a tab stop of its own: a focused panel has no visible ring, and its controls are reachable anyway. */}
          <TabsContent value={currentRange} tabIndex={-1} className="min-w-0">
            {/* Sample data only stands in when nothing real was passed, so it can never leak into a live dashboard. */}
            <DashboardContent
              pending={pending}
              error={error}
              onRetry={onRetry}
              metrics={metrics ?? SAMPLE_METRICS[currentRange]}
              activity={activity ?? (metrics ? [] : SAMPLE_ACTIVITY)}
              attention={attention ?? (metrics ? undefined : SAMPLE_ATTENTION)}
              emptyActionLabel={emptyActionLabel}
              onEmptyAction={onEmptyAction}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export { DashboardOverview, type DashboardOverviewProps, type DashboardActivity, type DashboardAttention, type DashboardMetric, type DashboardRange }
