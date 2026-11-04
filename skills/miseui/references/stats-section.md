# Stats Section

Numbers that make a claim believable, in three decisions: several of equal weight, one to remember above the rest, or each beside what it counts. The figures in this preview are examples and say so.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/stats-section.json
```

## Why it looks like this

**Concreteness effect.** A specific number is easier to believe and to remember than an adjective, because it sounds measured. Each number counts up once when seen, which draws the eye to the section without moving anything afterwards. Screen readers get the final value at once, and with reduced motion so does everyone else.

**Don't.** Do not show a number you cannot back up, or one that is impressive only because the unit is vague. Do not use it with small numbers early on, since 12 customers reads worse than saying nothing. Leave out more than five: past that, nobody remembers any of them.

## Designs

Pass one as the `variant` prop.

- `row` (Chunking): Three to five numbers of equal weight, right after a claim: quick to take in as one line of proof.
- `plate` (Isolation effect): One number is the story and the rest support it. Put that one first in the list.
- `split` (Framing effect): The numbers need explaining before they mean anything, as with a report or a security page: each sits beside what it counts and where it comes from.

## Usage

```tsx
import { StatsSection } from "@/components/stats-section"

<StatsSection
  headline="Less time writing it down."
  headlineQuiet="More time doing it."
  stats={[
    { id: "calls", value: 1240, label: "Calls summarized this week" },
    { id: "owners", value: 94, suffix: "%", label: "Action items with an owner" },
  ]}
/>

// The first number is the one to remember
<StatsSection variant="plate" stats={stats} note="Measured across all workspaces in March." />

// Each number beside its source. A server-rendered page should pass a locale.
<StatsSection
  variant="split"
  locale="en-US"
  description="Why these matter, in one sentence."
  stats={[{ id: "speed", value: 2, suffix: " min", label: "From hang-up to summary", detail: "The median for a one hour call." }]}
/>
```

Exports: `StatsSection`
