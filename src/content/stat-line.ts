import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "stat-line",
  title: "Stat Line",
  category: "display",
  description: "One line of several figures, before and after included: equal columns, a running sentence or one big number above the rest.",
  why: {
    principle: "Chunking",
    explanation:
      "Three or four numbers read as one fact when they sit in one line, and a before and after puts the comparison in the figure instead of asking anyone to do it. The numbers use tabular digits, so a column of them lines up and is easy to compare.",
    avoid:
      "For one number with a trend and a chart, use a stat. Do not line up more than about four, and only put figures together that belong to the same story.",
  },
  designs: [
    {
      name: "divided",
      principle: "Alignment",
      use: "A band of results under a heading, where equal columns let the figures be compared.",
    },
    {
      name: "run",
      principle: "Reading flow",
      use: "Inside text or a card footer, where figures should read as part of a sentence and not stop it.",
    },
    {
      name: "lead",
      principle: "Visual hierarchy",
      use: "A case study with one result that matters most, with the others as support underneath.",
    },
  ],
  effects: [
    {
      name: "count-up",
      principle: "Peak-end rule",
      use: "A result on a page people scroll to: counting from the old value to the new one acts out the improvement.",
    },
  ],
  usage: `import { StatLine } from "@/components/ui/stat-line"

<StatLine
  effect="count-up"
  items={[
    { label: "Page load", value: 1.4, from: 3.2, unit: "s" },
    { label: "Monthly visits", value: 12800 },
    { label: "Median session", value: "4m 12s" },
  ]}
/>`,
  exports: ["StatLine"],
}
