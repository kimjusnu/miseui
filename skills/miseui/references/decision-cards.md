# Decision Cards

A record of decisions: the question, what was chosen, what lost and why.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/decision-cards.json
```

## Why it looks like this

**Credibility through trade-offs.** Showing what was turned down proves a choice was a choice. Readers trust a reason more when they can see the option it beat, and the fixed shape makes a list of decisions quick to compare.

**Don't.** Do not use it for options still open; that is a comparison table. If nothing was seriously considered instead, a plain sentence is more honest than an invented alternative.

## Designs

Pass one as the `variant` prop.

- `split` (Side by side comparison): A case study with a few big decisions, where each one deserves a card and the winner should be seen first.
- `diff` (Familiar metaphor): A technical write-up, where struck out and written in reads like a code review and the chosen line carries the page.
- `ledger` (Information density): A long log of decisions in a design doc or a wiki, one short record per row.

## Effects

Pass one as the `effect` prop.

- `disclose` (Progressive disclosure): More than about five decisions: readers scan the outcomes and open only the reasons they want to argue with.

## Usage

```tsx
import { DecisionCards } from "@/components/ui/decision-cards"

<DecisionCards
  variant="diff"
  items={[
    {
      title: "Where should search run?",
      chosen: "In the database",
      rejected: ["A hosted search service", "A separate index"],
      reason: "Eight thousand rows did not justify one more system to keep in step.",
    },
  ]}
/>
```

Exports: `DecisionCards`
