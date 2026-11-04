import { useState } from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { DataTable, type DataTableColumn } from "@/registry/miseui/ui/data-table"
import { Skeleton } from "@/registry/miseui/ui/skeleton"
import { Status, type StatusTone } from "@/registry/miseui/ui/status"
import { AttentionItem, PANEL_CLASS, type DashboardAttention, type DashboardMetric } from "./dashboard-overview-parts"

interface DashboardWorkItem {
  id: string
  customer: string
  detail?: string
  status: string
  statusTone?: StatusTone
  /** Already formatted: this block never guesses a currency or a locale. */
  amount: string
  /** What the amount column sorts by. */
  amountValue?: number
  due: string
  /** What the due column sorts by, such as a timestamp. */
  dueValue?: number
  actionLabel: string
}

const MAX_NUMBERS = 4
const SKELETON_ROWS = 5

/** The list is the page, so the numbers give up their plate and sit on the ground as one sentence. */
function NumberLine({ metrics }: { metrics: readonly DashboardMetric[] }) {
  return (
    <dl aria-label="Key numbers" className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
      {metrics.slice(0, MAX_NUMBERS).map((metric) => (
        <div key={metric.id} className="flex items-baseline gap-2 whitespace-nowrap">
          <dt className="order-last text-[13px] text-muted-foreground">{metric.label}</dt>
          <dd className={cn("text-[15px] font-medium tabular-nums", metric.changeTone === "negative" && "text-destructive")}>{metric.value}</dd>
          {metric.change ? <dd className="sr-only">{metric.change}</dd> : null}
        </div>
      ))}
    </dl>
  )
}

function workColumns(handled: readonly string[], toggle: (item: DashboardWorkItem) => void): DataTableColumn<DashboardWorkItem>[] {
  const isHandled = (item: DashboardWorkItem) => handled.includes(item.id)
  return [
    {
      key: "customer",
      header: "Customer",
      hideable: false,
      cell: (item) => (
        <span className="block min-w-0">
          <span className="block text-sm">{item.customer}</span>
          {item.detail ? <span className="block text-[13px] text-muted-foreground">{item.detail}</span> : null}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      value: (item) => (isHandled(item) ? "Handled" : item.status),
      cell: (item) => (
        <Status state="custom" tone={isHandled(item) ? "success" : (item.statusTone ?? "neutral")} className="text-[13px]">
          {isHandled(item) ? "Handled" : item.status}
        </Status>
      ),
    },
    { key: "amount", header: "Amount", numeric: true, filterable: false, value: (item) => item.amountValue ?? item.amount, cell: (item) => item.amount },
    { key: "due", header: "Due", filterable: false, value: (item) => item.dueValue ?? item.due, cell: (item) => <span className="whitespace-nowrap">{item.due}</span> },
    {
      key: "action",
      header: "Action",
      sortable: false,
      filterable: false,
      hideable: false,
      value: () => "",
      // The same button changes job and is never removed, so keyboard focus stays on the row just handled.
      cell: (item) => (
        <Button variant="outline" size="sm" aria-label={`${isHandled(item) ? "Undo" : item.actionLabel}: ${item.customer}`} className="pointer-coarse:h-10" onClick={() => toggle(item)}>
          {isHandled(item) ? "Undo" : item.actionLabel}
        </Button>
      ),
    },
  ]
}

interface WorkListBodyProps {
  metrics: readonly DashboardMetric[]
  items: readonly DashboardWorkItem[]
  title: string
  attention?: DashboardAttention
  /** Fires with the row and whether it is now handled. Update your data here. */
  onAction?: (item: DashboardWorkItem, handled: boolean) => void
}

function WorkListBody({ metrics, items, title, attention, onAction }: WorkListBodyProps) {
  const [handled, setHandled] = useState<readonly string[]>([])
  const toggle = (item: DashboardWorkItem) => {
    const next = !handled.includes(item.id)
    setHandled(next ? [...handled, item.id] : handled.filter((id) => id !== item.id))
    onAction?.(item, next)
  }
  const columns = workColumns(handled, toggle)
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <NumberLine metrics={metrics} />
      {attention ? <AttentionItem key={attention.title} attention={attention} /> : null}
      {/* From @xl the table has room, so it earns a plate. Narrower it turns into cards, and a plate around cards is a plate on a plate. */}
      <div className="min-w-0 @xl:rounded-2xl @xl:border @xl:bg-background @xl:p-4 @xl:dark:bg-card">
        <DataTable label={title} variant="cards" rows={items} columns={columns} emptyText="Nothing needs you right now." labels={{ filter: "Filter this list" }} />
      </div>
    </div>
  )
}

function WorkListSkeleton() {
  return (
    <div role="status" aria-label="Loading dashboard" className="flex flex-col gap-4">
      <Skeleton effect="wave" className="h-5 w-full max-w-xl" />
      <div className={cn(PANEL_CLASS, "flex flex-col gap-4 p-4")}>
        <Skeleton effect="wave" className="h-9 w-full" />
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <Skeleton key={index} effect="wave" className="h-10 w-full" />
        ))}
      </div>
    </div>
  )
}

export { WorkListBody, WorkListSkeleton, type DashboardWorkItem }
