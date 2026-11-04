import type { ChartPoint } from "./dashboard-overview-chart"
import type { DashboardActivity, DashboardAttention, DashboardMetric, DashboardRange } from "./dashboard-overview-parts"
import type { DashboardWorkItem } from "./dashboard-overview-table"

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
const formatCount = (value: number) => value.toLocaleString("en-US")
const formatPercent = (value: number) => `${value}%`

const WEEK = [47702, 47702, 47886, 47886, 48066, 48132, 48216]
const MONTH = [
  46076, 46076, 46160, 46244, 46244, 46118, 46298, 46382, 46382, 46466, 46550, 46734, 46734, 46650, 46818, 46902, 46986,
  47170, 47170, 47086, 47254, 47338, 47422, 47618, 47618, 47702, 47702, 47886, 48066, 48216,
]
const QUARTER = [43318, 43612, 43780, 44102, 44018, 44496, 44910, 45238, 45154, 45702, 46076, 47170, 48216]

/** Only the analytics design draws these. Each ends on the figure its metric shows, so the chart and the number agree. */
const SUBSCRIPTIONS = {
  week: [1273, 1275, 1276, 1279, 1280, 1282, 1284],
  month: [1247, 1248, 1250, 1251, 1251, 1253, 1255, 1256, 1258, 1258, 1260, 1262, 1263, 1263, 1265, 1267, 1268, 1270, 1270, 1272, 1273, 1274, 1276, 1277, 1277, 1279, 1280, 1281, 1283, 1284],
  quarter: [1172, 1181, 1188, 1196, 1201, 1213, 1222, 1231, 1238, 1249, 1258, 1272, 1284],
}
const CONVERSION = {
  week: [23.4, 23.5, 23.5, 23.7, 23.8, 24, 24.1],
  month: [22.2, 22.2, 22.3, 22.3, 22.4, 22.4, 22.5, 22.5, 22.5, 22.6, 22.6, 22.7, 22.7, 22.8, 22.8, 22.8, 22.9, 22.9, 23, 23, 23, 23.1, 23.1, 23.2, 23.2, 23.2, 23.3, 23.3, 23.4, 23.4],
  quarter: [19.2, 19.4, 19.6, 19.7, 20, 20.2, 20.4, 20.6, 20.8, 21, 21.2, 21.5, 21.8],
}
const CHURN = {
  week: [0, 1, 0, 0, 0, 1, 0],
  month: [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
  quarter: [2, 3, 2, 3, 2, 2, 3, 2, 2, 3, 2, 3, 2],
}

interface RangeFigures {
  points: ChartPoint[]
  change: string
  subscriptions: string
  conversion: [string, string]
  churn: [string, string, DashboardMetric["changeTone"]]
  series: { subscriptions: ChartPoint[]; conversion: ChartPoint[]; churn: ChartPoint[] }
}

function metricsFor({ points, change, subscriptions, conversion, churn, series }: RangeFigures): DashboardMetric[] {
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
    { id: "subscriptions", label: "Active subscriptions", value: "1,284", change: subscriptions, changeTone: "positive", series: series.subscriptions, formatPoint: formatCount },
    { id: "conversion", label: "Trial to paid", value: conversion[0], change: conversion[1], changeTone: "positive", series: series.conversion, formatPoint: formatPercent },
    { id: "churn", label: "Accounts churned", value: churn[0], change: churn[1], changeTone: churn[2], series: series.churn, formatPoint: formatCount },
  ]
}

const SAMPLE_METRICS: Readonly<Record<DashboardRange, DashboardMetric[]>> = {
  "7d": metricsFor({
    points: dated(WEEK, 1),
    change: "+$514 (+1.1%) from last week",
    subscriptions: "+11 this week",
    conversion: ["24.1%", "+0.7 pts"],
    churn: ["2", "Same as last week", "neutral"],
    series: { subscriptions: dated(SUBSCRIPTIONS.week, 1), conversion: dated(CONVERSION.week, 1), churn: dated(CHURN.week, 1) },
  }),
  "30d": metricsFor({
    points: dated(MONTH, 1),
    change: "+$2,140 (+4.6%) from 30 days ago",
    subscriptions: "+37 in 30 days",
    conversion: ["23.4%", "+1.2 pts"],
    churn: ["9", "3 more than last period", "negative"],
    series: { subscriptions: dated(SUBSCRIPTIONS.month, 1), conversion: dated(CONVERSION.month, 1), churn: dated(CHURN.month, 1) },
  }),
  "90d": metricsFor({
    points: dated(QUARTER, 7),
    change: "+$4,898 (+11.3%) from 90 days ago",
    subscriptions: "+112 in 90 days",
    conversion: ["21.8%", "+2.6 pts"],
    churn: ["31", "4 fewer than last period", "positive"],
    series: { subscriptions: dated(SUBSCRIPTIONS.quarter, 7), conversion: dated(CONVERSION.quarter, 7), churn: dated(CHURN.quarter, 7) },
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

const SAMPLE_WORK: readonly DashboardWorkItem[] = [
  { id: "w1", customer: "Pell Street Studio", detail: "Team plan", status: "Card declined", statusTone: "danger", amount: "$264", amountValue: 264, due: "Nov 1", dueValue: 1, actionLabel: "Retry" },
  { id: "w2", customer: "Dunmore Dental", detail: "Starter plan", status: "Card expired", statusTone: "danger", amount: "$84", amountValue: 84, due: "Oct 30", dueValue: -1, actionLabel: "Ask for a card" },
  { id: "w3", customer: "Quill & Ash", detail: "Invoice 2304", status: "11 days late", statusTone: "warning", amount: "$1,260", amountValue: 1260, due: "Oct 22", dueValue: -9, actionLabel: "Remind" },
  { id: "w4", customer: "Orchard Row", detail: "Team plan", status: "Retry on Friday", statusTone: "neutral", amount: "$126", amountValue: 126, due: "Nov 2", dueValue: 2, actionLabel: "Retry" },
  { id: "w5", customer: "Tern Harbor Books", detail: "Final invoice", status: "4 days late", statusTone: "warning", amount: "$84", amountValue: 84, due: "Oct 29", dueValue: -2, actionLabel: "Remind" },
]

export { SAMPLE_ACTIVITY, SAMPLE_ATTENTION, SAMPLE_METRICS, SAMPLE_WORK }
