import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "dashboard-overview",
  title: "Dashboard Overview",
  category: "blocks",
  description:
    "A product dashboard in three decisions: one number first, one large chart first, or the work list first with the numbers as one line. All figures shown are sample data.",
  why: {
    principle: "Visual hierarchy: one number first",
    explanation:
      "People open a dashboard to answer one question, usually whether things are going well, and a grid of equal cards makes them read every card to find out. The single large number answers it in a glance, the chart says whether it is a trend or a blip, and only then does the eye drop to the smaller figures. The one item that needs a person sits apart from the numbers, so it reads as a job and not as another statistic.",
    avoid:
      "Do not promote a second metric to the same size because a stakeholder asked for it; pick the number the team would check first. Keep the attention slot to one real item, and leave it out when nothing needs a person, or people learn to ignore it. The chart's scale does not start at zero, which suits a slowly moving total but flatters a metric where the size of the bar is the point.",
  },
  designs: [
    {
      name: "overview",
      principle: "Visual hierarchy",
      use: "Someone checks in once a day and has one question: are things going well?",
    },
    {
      name: "analytics",
      principle: "Overview first, then details on demand",
      use: "The question is how something is changing, and people compare several metrics over time on one chart.",
    },
    {
      name: "table",
      principle: "Task focus",
      use: "People open the page to work through items, so the list comes first and the numbers only give context.",
    },
  ],
  usage: `import { DashboardOverview } from "@/components/dashboard-overview"

<DashboardOverview
  pending={isLoading}
  metrics={[
    { id: "mrr", label: "Monthly recurring revenue", value: "$48,216", change: "+4.6%", changeTone: "positive", series },
    { id: "subs", label: "Active subscriptions", value: "1,284" },
  ]}
  activity={events}
  range={range}
  onRangeChange={setRange}
/>

// One large chart. Every metric with a series can be chosen above it.
<DashboardOverview variant="analytics" metrics={metrics} activity={events} />

// The work list first. The numbers shrink to one line above it.
<DashboardOverview
  variant="table"
  metrics={metrics}
  workTitle="Payments to chase"
  workItems={[
    { id: "1", customer: "Pell Street Studio", status: "Card declined", statusTone: "danger", amount: "$264", amountValue: 264, due: "Nov 1", actionLabel: "Retry" },
  ]}
  onWorkAction={(item, handled) => (handled ? api.retry(item.id) : api.cancelRetry(item.id))}
/>`,
  exports: ["DashboardOverview"],
}
