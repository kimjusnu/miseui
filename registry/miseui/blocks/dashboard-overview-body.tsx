import type * as React from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { AreaChart } from "./dashboard-overview-chart"
import {
  ActivityList,
  AttentionItem,
  ChangeLabel,
  PANEL_CLASS,
  SecondaryMetrics,
  type DashboardActivity,
  type DashboardAttention,
  type DashboardMetric,
} from "./dashboard-overview-parts"
import { DashboardMessage } from "./dashboard-overview-states"

/** One number first means the row under it stays short. A fourth metric belongs on its own page. */
const MAX_SECONDARY = 3

interface OverviewBodyProps {
  metrics: readonly DashboardMetric[]
  activity: readonly DashboardActivity[]
  attention?: DashboardAttention
}

function OverviewBody({ metrics, activity, attention }: OverviewBodyProps) {
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

interface DashboardContentProps {
  pending: boolean
  error?: string
  onRetry?: () => void
  /** No metrics at all, which is the empty state in every design. */
  empty: boolean
  emptyActionLabel: string
  onEmptyAction?: () => void
  /** Same shape as the loaded design, so nothing jumps when the numbers land. */
  skeleton: React.ReactNode
  children: React.ReactNode
}

function DashboardContent({ pending, error, onRetry, empty, emptyActionLabel, onEmptyAction, skeleton, children }: DashboardContentProps) {
  if (pending) return skeleton
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
  if (empty) {
    return (
      <DashboardMessage
        title="No numbers to show yet"
        description="Connect a billing account and your revenue appears here within a few minutes."
        action={<Button variant="mise" onClick={onEmptyAction}>{emptyActionLabel}</Button>}
      />
    )
  }
  return children
}

export { DashboardContent, OverviewBody }
