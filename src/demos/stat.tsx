import type * as React from "react"
import { Stat } from "@/registry/miseui/ui/stat"

const usd = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)

const REVENUE = [31, 34, 33, 38, 41, 44, 48]
const RESPONSE = [8.2, 7.6, 7.9, 6.8, 6.1, 5.4, 5.1]

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="plain, more revenue is good">
        <Stat label="Monthly revenue" value={48200} format={usd} change={12.4} changeNote="vs last month" polarity="up-is-good" />
      </Cell>
      <Cell label="card, a drop here is good">
        <Stat
          variant="card"
          label="First response"
          value="5m 06s"
          change={-18}
          changeNote="vs last week"
          polarity="down-is-good"
          trend={RESPONSE}
          trendLabel="Falling over seven weeks"
        />
      </Cell>
      <Cell label="compact, a stack of metrics">
        <div className="grid min-w-0">
          <Stat variant="compact" label="Active seats" value={1284} locale="en-US" change={3.1} trend={REVENUE} trendLabel="Rising over seven months" />
          <Stat variant="compact" label="Failed payments" value={17} change={21} polarity="down-is-good" />
          <Stat variant="compact" label="Refunds" value={usd(320)} change={0} />
        </div>
      </Cell>
      <Cell label="inline, inside a header">
        <div className="min-w-0">
          <Stat variant="inline" label="Uptime" value="99.98%" change={0.02} changeSuffix=" pts" polarity="up-is-good" />
        </div>
      </Cell>
      <Cell label="count-up effect, once on view">
        <Stat effect="count-up" variant="card" label="Orders this quarter" value={24816} locale="en-US" change={6.5} polarity="up-is-good" trend={REVENUE} trendLabel="Rising over seven months" />
      </Cell>
      <Cell label="count-up effect, plain">
        <Stat effect="count-up" label="Monthly revenue" value={48200} format={usd} />
      </Cell>
    </div>
  )
}
