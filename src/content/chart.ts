import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "chart",
  title: "Chart",
  category: "display",
  description: "Bar, line, area and donut charts from one data shape, with axes in round numbers, points you can walk by keyboard and a real table behind them.",
  why: {
    principle: "Data-ink ratio",
    explanation:
      "Every mark has to earn its ink. The accent carries the main series and the rest stays grey, gridlines are faint, and axes land on round numbers so people can read a value without doing sums. The detail waits in a tooltip until someone asks for it.",
    avoid:
      "Do not use a donut for more than five or six parts, or to compare parts of nearly equal size: bars read length far better than angle. Do not use a chart for two or three numbers, where plain text is clearer.",
  },
  designs: [
    {
      name: "bar",
      principle: "Pre-attentive length",
      use: "Comparing amounts across categories, where the eye judges length faster than anything else.",
    },
    {
      name: "line",
      principle: "Law of continuity",
      use: "A trend over time, especially one that does not start near zero: the axis fits the data instead of forcing a zero baseline.",
    },
    {
      name: "area",
      principle: "Figure and ground",
      use: "A trend where the total itself matters, such as revenue. The fill gives it weight, so the axis always starts at zero.",
    },
    {
      name: "donut",
      principle: "Part to whole",
      use: "Shares of one total with a few parts, with the total in the middle and exact figures listed underneath.",
    },
  ],
  effects: [
    {
      name: "draw",
      principle: "Progressive disclosure",
      use: "A chart that is the main point of a section: it builds once when first seen, so the eye follows the shape. Never again after that, and not at all under reduced motion.",
    },
  ],
  usage: `import { Chart } from "@/components/ui/chart"

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
/>`,
  exports: ["Chart"],
}
