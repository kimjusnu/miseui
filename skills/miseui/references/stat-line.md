# Stat Line

One line of several figures, before and after included: equal columns, a running sentence or one big number above the rest.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/stat-line.json
```

## Why it looks like this

**Chunking.** Three or four numbers read as one fact when they sit in one line, and a before and after puts the comparison in the figure instead of asking anyone to do it. The numbers use tabular digits, so a column of them lines up and is easy to compare.

**Don't.** For one number with a trend and a chart, use a stat. Do not line up more than about four, and only put figures together that belong to the same story.

## Designs

Pass one as the `variant` prop.

- `divided` (Alignment): A band of results under a heading, where equal columns let the figures be compared.
- `run` (Reading flow): Inside text or a card footer, where figures should read as part of a sentence and not stop it.
- `lead` (Visual hierarchy): A case study with one result that matters most, with the others as support underneath.

## Effects

Pass one as the `effect` prop.

- `count-up` (Peak-end rule): A result on a page people scroll to: counting from the old value to the new one acts out the improvement.

## Usage

```tsx
import { StatLine } from "@/components/ui/stat-line"

<StatLine
  effect="count-up"
  items={[
    { label: "Page load", value: 1.4, from: 3.2, unit: "s" },
    { label: "Monthly visits", value: 12800 },
    { label: "Median session", value: "4m 12s" },
  ]}
/>
```

Exports: `StatLine`
