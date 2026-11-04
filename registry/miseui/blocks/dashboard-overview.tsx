import type * as React from "react"
import { ChartLine, LayoutDashboard, ReceiptText, Settings, Users } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Tabs, TabsContent } from "@/registry/miseui/ui/tabs"
import { AnalyticsBody, AnalyticsSkeleton } from "./dashboard-overview-analytics"
import { DashboardContent, OverviewBody } from "./dashboard-overview-body"
import {
  DashboardRail,
  type DashboardActivity,
  type DashboardAttention,
  type DashboardMetric,
  type DashboardNavItem,
  type DashboardRange,
} from "./dashboard-overview-parts"
import { SAMPLE_ACTIVITY, SAMPLE_ATTENTION, SAMPLE_METRICS, SAMPLE_WORK } from "./dashboard-overview-sample"
import { RangeHeader, useRange } from "./dashboard-overview-shell"
import { DashboardSkeleton } from "./dashboard-overview-states"
import { WorkListBody, WorkListSkeleton, type DashboardWorkItem } from "./dashboard-overview-table"

type DashboardVariant = "overview" | "analytics" | "table"

const DEFAULT_NAV: readonly DashboardNavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "customers", label: "Customers", icon: Users },
  { id: "invoices", label: "Invoices", icon: ReceiptText },
  { id: "reports", label: "Reports", icon: ChartLine },
  { id: "settings", label: "Settings", icon: Settings },
]

interface DashboardOverviewProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** `overview` one number first, `analytics` one large chart first, `table` the work list first. Anything else is `overview`. */
  variant?: DashboardVariant
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
  /** `table` only: the rows to work through. */
  workItems?: readonly DashboardWorkItem[]
  /** `table` only: heads the page and names the table. */
  workTitle?: string
  /** `table` only: fires with the row and whether it is now handled. */
  onWorkAction?: (item: DashboardWorkItem, handled: boolean) => void
}

const SKELETON: Readonly<Record<DashboardVariant, React.ReactNode>> = {
  overview: <DashboardSkeleton />,
  analytics: <AnalyticsSkeleton />,
  table: <WorkListSkeleton />,
}

type DashboardPanelProps = Pick<
  DashboardOverviewProps,
  "metrics" | "activity" | "attention" | "error" | "onRetry" | "onEmptyAction" | "workItems" | "onWorkAction"
> & {
  shape: DashboardVariant
  range: DashboardRange
  pending: boolean
  emptyActionLabel: string
  workTitle: string
}

function DashboardPanel({ shape, range, pending, error, onRetry, metrics, activity, attention, emptyActionLabel, onEmptyAction, workItems, workTitle, onWorkAction }: DashboardPanelProps) {
  // Sample data only stands in when nothing real was passed, so it can never leak into a live dashboard.
  const shownMetrics = metrics ?? SAMPLE_METRICS[range]
  const content = {
    metrics: shownMetrics,
    activity: activity ?? (metrics ? [] : SAMPLE_ACTIVITY),
    attention: attention ?? (metrics ? undefined : SAMPLE_ATTENTION),
  }
  return (
    <DashboardContent
      pending={pending}
      error={error}
      onRetry={onRetry}
      empty={shownMetrics.length === 0}
      emptyActionLabel={emptyActionLabel}
      onEmptyAction={onEmptyAction}
      skeleton={SKELETON[shape]}
    >
      {shape === "analytics" ? <AnalyticsBody {...content} /> : null}
      {shape === "overview" ? <OverviewBody {...content} /> : null}
      {/* The sample list is already the failed payments, so the sample attention item would only repeat it. */}
      {shape === "table" ? <WorkListBody metrics={shownMetrics} items={workItems ?? (metrics ? [] : SAMPLE_WORK)} title={workTitle} attention={attention} onAction={onWorkAction} /> : null}
    </DashboardContent>
  )
}

function DashboardOverview({
  variant,
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
  workItems,
  workTitle = "Payments to chase",
  onWorkAction,
  className,
  ...props
}: DashboardOverviewProps) {
  const [currentRange, selectRange] = useRange(range, defaultRange, onRangeChange)
  const shape: DashboardVariant = variant === "analytics" || variant === "table" ? variant : "overview"
  const panel = { shape, range: currentRange, pending, error, onRetry, metrics, activity, attention, emptyActionLabel, onEmptyAction, workItems, workTitle, onWorkAction }

  return (
    <div data-slot="dashboard-overview" data-variant={shape} className={cn("@container w-full bg-muted dark:bg-background", className)} {...props}>
      <div className={cn("flex min-w-0 flex-col", shape !== "analytics" && "@3xl:flex-row")}>
        <DashboardRail product={product} nav={nav} onNavigate={onNavigate} layout={shape === "analytics" ? "bar" : "rail"} touch={shape !== "overview"} />
        <Tabs value={currentRange} onValueChange={selectRange} className="min-w-0 flex-1 gap-6 p-4 @md:p-6 @3xl:p-8">
          <RangeHeader title={shape === "table" ? `${workTitle}.` : "Overview."} range={currentRange} pending={pending} touch={shape !== "overview"} />
          {/* Not a tab stop of its own: a focused panel has no visible ring, and its controls are reachable anyway. */}
          <TabsContent value={currentRange} tabIndex={-1} className="min-w-0">
            <DashboardPanel {...panel} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export {
  DashboardOverview,
  type DashboardOverviewProps,
  type DashboardActivity,
  type DashboardAttention,
  type DashboardMetric,
  type DashboardRange,
  type DashboardVariant,
  type DashboardWorkItem,
}
