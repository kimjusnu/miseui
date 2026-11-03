# Stat

One number with its label, change and a small trend line. Colour only appears once you have said which direction is good.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/stat.json
```

## Why it looks like this

**Von Restorff effect.** A dashboard is read in glances, so the figure stands out from everything around it and the rest stays quiet. The change answers the next question, better or worse, and arrows and signs say so without depending on colour alone.

**Don't.** Do not turn every number into a stat; four on a screen is usually the limit of what anyone compares. Leave polarity neutral when up is neither good nor bad, since green on a rising cost tells people the wrong story.

## Designs

Pass one as the `variant` prop.

- `plain` (Visual hierarchy): On a page or inside a section you already have, where the large figure alone is enough to anchor the eye.
- `card` (Law of common region): In a dashboard grid, where each metric needs its own surface and its trend runs along the foot of the card.
- `compact` (Law of proximity): In a side panel or a stack of many metrics, read down one column like a small table.
- `inline` (Gestalt continuity): In a page header or a line of text, when the number supports something else and must not take a block of its own.

## Effects

Pass one as the `effect` prop.

- `count-up` (Attention capture): Once, for a headline figure the first time it scrolls into view. Tabular figures and a reserved width keep everything beside it still.

## Usage

```tsx
import { Stat } from "@/components/ui/stat"

<Stat
  variant="card"
  effect="count-up"
  label="Monthly revenue"
  value={48200}
  format={(value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)}
  change={12.4}
  changeNote="vs last month"
  polarity="up-is-good"
  trend={[31, 34, 33, 38, 41, 44, 48]}
  trendLabel="Rising over seven months"
/>
```

Exports: `Stat`
