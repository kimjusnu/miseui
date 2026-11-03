import type * as React from "react"
import { Chart, type ChartVariant } from "@/registry/miseui/ui/chart"

const MONTHS = [
  { month: "Jan", visits: 1240, signups: 310 },
  { month: "Feb", visits: 1480, signups: 340 },
  { month: "Mar", visits: 1390, signups: 420 },
  { month: "Apr", visits: 1820, signups: 510 },
  { month: "May", visits: 2150, signups: 560 },
  { month: "Jun", visits: 1960, signups: 640 },
]

const PLANS = [
  { plan: "Team", seats: 420 },
  { plan: "Business", seats: 260 },
  { plan: "Solo", seats: 180 },
  { plan: "Trial", seats: 90 },
]

const VISITS = [{ key: "visits", label: "Visits" }]
const BOTH = [...VISITS, { key: "signups", label: "Signups" }]
const VARIANTS: readonly ChartVariant[] = ["bar", "line", "area"]

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
      {VARIANTS.map((variant) => (
        <Cell key={variant} label={variant}>
          <Chart label={`Visits by month, ${variant}`} variant={variant} data={MONTHS} index="month" series={VISITS} />
        </Cell>
      ))}
      <Cell label="donut">
        <Chart label="Seats by plan" variant="donut" data={PLANS} index="plan" series={[{ key: "seats", label: "Seats" }]} height={160} />
      </Cell>
      <Cell label="two series, grouped bars">
        <Chart label="Visits and signups by month, bars" data={MONTHS} index="month" series={BOTH} />
      </Cell>
      <Cell label="draw effect, line with two series">
        <Chart label="Visits and signups by month, line" variant="line" effect="draw" data={MONTHS} index="month" series={BOTH} />
      </Cell>
      <Cell label="draw effect, area">
        <Chart label="Visits by month, area" variant="area" effect="draw" data={MONTHS} index="month" series={VISITS} />
      </Cell>
      <Cell label="draw effect, donut">
        <Chart label="Seats by plan, drawn" variant="donut" effect="draw" data={PLANS} index="plan" series={[{ key: "seats", label: "Seats" }]} height={160} />
      </Cell>
    </div>
  )
}
