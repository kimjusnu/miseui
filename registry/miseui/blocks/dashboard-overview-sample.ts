import type { ChartPoint } from "./dashboard-overview-chart"
import type { DashboardActivity, DashboardAttention, DashboardMetric, DashboardRange } from "./dashboard-overview-parts"

/** Everything in this file is invented sample data. Pass `metrics` and none of it is shown. */

const SAMPLE_LAST_DAY = Date.UTC(2026, 10, 2)
const DAY_MS = 86_400_000
const dayLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" })

/** Dates counted back from a fixed day, so the sample renders the same on the server and in a test. */
function dated(values: readonly number[], stepDays: number): ChartPoint[] {
  return values.map((value, index) => ({
    label: dayLabel.format(SAMPLE_LAST_DAY - (values.length - 1 - index) * stepDays * DAY_MS),
    value,
  }))
}

const formatDollars = (value: number) => `$${value.toLocaleString("en-US")}`

const WEEK = [47702, 47702, 47886, 47886, 48066, 48132, 48216]
const MONTH = [
  46076, 46076, 46160, 46244, 46244, 46118, 46298, 46382, 46382, 46466, 46550, 46734, 46734, 46650, 46818, 46902, 46986,
  47170, 47170, 47086, 47254, 47338, 47422, 47618, 47618, 47702, 47702, 47886, 48066, 48216,
]
const QUARTER = [43318, 43612, 43780, 44102, 44018, 44496, 44910, 45238, 45154, 45702, 46076, 47170, 48216]

interface RangeFigures {
  points: ChartPoint[]
  change: string
  subscriptions: string
  conversion: [string, string]
  churn: [string, string, DashboardMetric["changeTone"]]
}

function metricsFor({ points, change, subscriptions, conversion, churn }: RangeFigures): DashboardMetric[] {
  return [
    {
      id: "mrr",
      label: "Monthly recurring revenue",
      value: "$48,216",
      change,
      changeTone: "positive",
      series: points,
      formatPoint: formatDollars,
    },
    { id: "subscriptions", label: "Active subscriptions", value: "1,284", change: subscriptions, changeTone: "positive" },
    { id: "conversion", label: "Trial to paid", value: conversion[0], change: conversion[1], changeTone: "positive" },
    { id: "churn", label: "Accounts churned", value: churn[0], change: churn[1], changeTone: churn[2] },
  ]
}

const SAMPLE_METRICS: Readonly<Record<DashboardRange, DashboardMetric[]>> = {
  "7d": metricsFor({
    points: dated(WEEK, 1),
    change: "+$514 (+1.1%) from last week",
    subscriptions: "+11 this week",
    conversion: ["24.1%", "+0.7 pts"],
    churn: ["2", "Same as last week", "neutral"],
  }),
  "30d": metricsFor({
    points: dated(MONTH, 1),
    change: "+$2,140 (+4.6%) from 30 days ago",
    subscriptions: "+37 in 30 days",
    conversion: ["23.4%", "+1.2 pts"],
    churn: ["9", "3 more than last period", "negative"],
  }),
  "90d": metricsFor({
    points: dated(QUARTER, 7),
    change: "+$4,898 (+11.3%) from 90 days ago",
    subscriptions: "+112 in 90 days",
    conversion: ["21.8%", "+2.6 pts"],
    churn: ["31", "4 fewer than last period", "positive"],
  }),
}

const SAMPLE_ACTIVITY: readonly DashboardActivity[] = [
  { id: "a1", title: "Pell Street Studio moved to Team", detail: "+$180 per month", time: "12 min ago" },
  { id: "a2", title: "Dunmore Dental started a trial", detail: "Invited 3 people", time: "1 hr ago" },
  { id: "a3", title: "Tern Harbor Books cancelled", detail: "-$84 per month, left a note", time: "4 hr ago" },
  { id: "a4", title: "Quill & Ash paid invoice 2291", detail: "$1,260, 11 days late", time: "Yesterday" },
  { id: "a5", title: "Orchard Row added 6 seats", detail: "+$126 per month", time: "Oct 31" },
]

const SAMPLE_ATTENTION: DashboardAttention = {
  title: "14 payments failed this week",
  description: "$1,092 is at risk. Automatic retries stop on Friday.",
  actionLabel: "Review payments",
}

export { SAMPLE_ACTIVITY, SAMPLE_ATTENTION, SAMPLE_METRICS }
