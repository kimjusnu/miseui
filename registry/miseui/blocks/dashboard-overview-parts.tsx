import type * as React from "react"
import { useState } from "react"
import { TriangleAlert } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import type { ChartPoint } from "./dashboard-overview-chart"

type DashboardRange = "7d" | "30d" | "90d"
type ChangeTone = "positive" | "negative" | "neutral"

interface DashboardMetric {
  id: string
  label: string
  /** Already formatted: this block never guesses a currency or a locale. */
  value: string
  change?: string
  /** Whether the change is good news, which its sign cannot tell: more churn is up and bad. */
  changeTone?: ChangeTone
  /** Drawn only for the first metric. */
  series?: readonly ChartPoint[]
  formatPoint?: (value: number) => string
}

interface DashboardActivity {
  id: string
  title: string
  detail?: string
  time: string
}

interface DashboardAttention {
  title: string
  description: string
  actionLabel: string
  onAction?: () => void
}

interface DashboardNavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const CAPTION_CLASS = "text-[13px] leading-relaxed text-muted-foreground"
/** A white panel on the pale canvas. Tinted from the ink, and off in dark mode, where it would read as a glow. */
const PANEL_CLASS =
  "rounded-2xl border bg-background dark:bg-card shadow-[0_1px_2px_color-mix(in_oklab,var(--foreground)_6%,transparent),0_16px_32px_-16px_color-mix(in_oklab,var(--foreground)_16%,transparent)] dark:shadow-none"
const TONE_CLASS: Record<ChangeTone, string> = {
  positive: "text-foreground",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
}

function ChangeLabel({ metric, className }: { metric: DashboardMetric; className?: string }) {
  if (!metric.change) return null
  return <span className={cn(TONE_CLASS[metric.changeTone ?? "neutral"], className)}>{metric.change}</span>
}

/** Sized by position, not by a card: the first of these outranks the rest, and all of them sit under the chart. */
function SecondaryMetrics({ metrics }: { metrics: readonly DashboardMetric[] }) {
  if (metrics.length === 0) return null
  return (
    <dl className={cn(PANEL_CLASS, "grid gap-6 p-4 @md:grid-cols-[3fr_2fr_2fr] @md:p-6")}>
      {metrics.map((metric, index) => (
        <div key={metric.id} className={cn("flex flex-col gap-1", index > 0 && "@md:border-l @md:pl-6")}>
          <dt className={CAPTION_CLASS}>{metric.label}</dt>
          <dd className={cn("text-title", index === 0 ? "text-2xl" : "text-lg")}>{metric.value}</dd>
          {metric.change ? (
            <dd className="text-[13px]">
              <ChangeLabel metric={metric} />
            </dd>
          ) : null}
        </div>
      ))}
    </dl>
  )
}

function AttentionItem({ attention }: { attention: DashboardAttention }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <section aria-label="Needs your attention" className={cn(PANEL_CLASS, "flex gap-3 p-4")}>
      <TriangleAlert aria-hidden="true" className="mt-1 size-4 shrink-0 text-destructive" />
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="text-[15px] font-medium">{attention.title}</h3>
        <p className={cn(CAPTION_CLASS, "text-pretty")}>{attention.description}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={attention.onAction}>
            {attention.actionLabel}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
            Later
          </Button>
        </div>
      </div>
    </section>
  )
}

function ActivityList({ activity }: { activity: readonly DashboardActivity[] }) {
  return (
    <section className={cn(PANEL_CLASS, "flex flex-col gap-2 p-4")}>
      <h3 className="text-[15px] font-medium">Recent activity</h3>
      {activity.length === 0 ? (
        <p className={cn(CAPTION_CLASS, "py-3")}>Nothing has happened in this period.</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {activity.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-[13px] leading-relaxed text-pretty">{item.title}</p>
                {item.detail ? <p className={CAPTION_CLASS}>{item.detail}</p> : null}
              </div>
              <span className={cn(CAPTION_CLASS, "shrink-0 whitespace-nowrap")}>{item.time}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

interface DashboardRailProps {
  product: string
  nav: readonly DashboardNavItem[]
  onNavigate?: (id: string) => void
}

/** A top bar under @3xl. The bar scrolls by itself, so five labels never push the page sideways on a phone. */
function DashboardRail({ product, nav, onNavigate }: DashboardRailProps) {
  const [active, setActive] = useState(nav[0]?.id ?? "")
  const select = (id: string) => {
    setActive(id)
    onNavigate?.(id)
  }
  return (
    <div className="flex min-w-0 flex-col gap-3 border-b p-4 @3xl:w-56 @3xl:shrink-0 @3xl:gap-6 @3xl:border-r @3xl:border-b-0">
      <p className="px-3 text-[15px] font-medium">{product}</p>
      <nav aria-label="Main" className="flex gap-1 overflow-x-auto @3xl:flex-col @3xl:overflow-visible">
        {nav.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={item.id === active ? "page" : undefined}
            onClick={() => select(item.id)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-3 rounded-md px-3 text-[13px] whitespace-nowrap outline-none",
              "transition-colors duration-(--duration-fast) ease-(--ease-mise)",
              "focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50",
              item.id === active ? "bg-background dark:bg-card text-foreground shadow-xs" : "text-muted-foreground hover:bg-background/60",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export {
  PANEL_CLASS,
  ActivityList,
  AttentionItem,
  ChangeLabel,
  DashboardRail,
  SecondaryMetrics,
  type DashboardActivity,
  type DashboardAttention,
  type DashboardMetric,
  type DashboardNavItem,
  type DashboardRange,
}
