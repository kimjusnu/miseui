# Chart

Bar, line, area and donut charts from one data shape, with axes in round numbers, points you can walk by keyboard and a real table behind them.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/chart.json
```

## Why it looks like this

**Data-ink ratio.** Every mark has to earn its ink. The accent carries the main series and the rest stays grey, gridlines are faint, and axes land on round numbers so people can read a value without doing sums. The detail waits in a tooltip until someone asks for it.

**Don't.** Do not use a donut for more than five or six parts, or to compare parts of nearly equal size: bars read length far better than angle. Do not use a chart for two or three numbers, where plain text is clearer.

## Designs

Pass one as the `variant` prop.

- `bar` (Pre-attentive length): Comparing amounts across categories, where the eye judges length faster than anything else.
- `line` (Law of continuity): A trend over time, especially one that does not start near zero: the axis fits the data instead of forcing a zero baseline.
- `area` (Figure and ground): A trend where the total itself matters, such as revenue. The fill gives it weight, so the axis always starts at zero.
- `donut` (Part to whole): Shares of one total with a few parts, with the total in the middle and exact figures listed underneath.

## Effects

Pass one as the `effect` prop.

- `draw` (Progressive disclosure): A chart that is the main point of a section: it builds once when first seen, so the eye follows the shape. Never again after that, and not at all under reduced motion.

## Usage

```tsx
import { Chart } from "@/components/ui/chart"

const data = [
  { month: "Jan", visits: 1200, signups: 120 },
  { month: "Feb", visits: 1800, signups: 210 },
]

<Chart
  label="Traffic by month"
  variant="line"
  effect="draw"
  data={data}
  index="month"
  series={[
    { key: "visits", label: "Visits" },
    { key: "signups", label: "Signups" },
  ]}
/>
```

Exports: `Chart`
