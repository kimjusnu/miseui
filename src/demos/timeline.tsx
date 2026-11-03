import { Timeline, type TimelineEvent } from "@/registry/miseui/ui/timeline"

const ORDER: readonly TimelineEvent[] = [
  { time: "2 Nov, 14:02", dateTime: "2026-11-02T14:02", title: "Order placed", body: "Three items, paid by card", status: "success" },
  { time: "2 Nov, 18:40", dateTime: "2026-11-02T18:40", title: "Packed at the Incheon warehouse", status: "success" },
  { time: "3 Nov, 09:12", dateTime: "2026-11-03T09:12", title: "Delivery attempt failed", body: "Nobody home, the courier left a note", status: "error" },
  { time: "Today, 11:00", title: "Out for a second attempt", status: "current" },
  { time: "Tomorrow", title: "Latest expected delivery" },
]

const DEPLOY: readonly TimelineEvent[] = [
  { time: "09:41", title: "Build started", status: "success" },
  { time: "09:44", title: "Tests passed", status: "success" },
  { time: "09:46", title: "Slow query on the orders page", status: "warning" },
  { time: "09:47", title: "Rollout at 40%", status: "current" },
  { time: "09:58", title: "Full rollout" },
]

const HISTORY: readonly TimelineEvent[] = [
  { time: "2021", title: "First shop opens", body: "Two people and a rented corner in Incheon." },
  { time: "2023", title: "Online store", body: "Half of all orders come through the site within a year." },
  { time: "2025", title: "Second warehouse", body: "Same-day delivery reaches the whole metro area." },
  { time: "2026", title: "Team of forty", status: "current", body: "Support and fulfilment move under one roof." },
]

const MILESTONES: readonly TimelineEvent[] = [
  { time: "January", title: "Research", status: "success" },
  { time: "March", title: "First prototype", status: "success" },
  { time: "June", title: "Private beta", status: "success" },
  { time: "October", title: "Public launch", status: "current" },
  { time: "Next year", title: "Mobile app" },
]

function Cell({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? "grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 sm:col-span-2" : "grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3"}>
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="vertical">
        <Timeline aria-label="Order history" events={ORDER} />
      </Cell>
      <Cell label="compact">
        <Timeline aria-label="Deployment log" variant="compact" events={DEPLOY} />
      </Cell>
      <Cell label="alternate, two sides when the container is wide" wide>
        <Timeline aria-label="Company history" variant="alternate" events={HISTORY} />
      </Cell>
      <Cell label="horizontal, scrolls inside itself" wide>
        <Timeline aria-label="Product milestones" variant="horizontal" events={MILESTONES} />
      </Cell>
      <Cell label="draw effect, vertical">
        <Timeline aria-label="Order history, drawn" effect="draw" events={ORDER} />
      </Cell>
      <Cell label="draw effect, compact">
        <Timeline aria-label="Deployment log, drawn" variant="compact" effect="draw" events={DEPLOY} />
      </Cell>
      <Cell label="draw effect, horizontal" wide>
        <Timeline aria-label="Product milestones, drawn" variant="horizontal" effect="draw" events={MILESTONES} />
      </Cell>
    </div>
  )
}
