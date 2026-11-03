# Timeline

Events in order with time, title, detail and a status that keeps its meaning under any accent, down a rail, on two sides, as one-liners or across a row.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/timeline.json
```

## Why it looks like this

**Law of continuity.** A line through the markers makes separate events read as one story, and the eye follows it without being told the order. Status colours stay fixed whatever the accent is, so a failure still looks like a failure, and most markers stay soft so the one that matters can be seen from a distance.

**Don't.** Do not use it for a process with steps still to do; that is Steps, which shows what comes next. Do not use it for a long log people search or filter, which belongs in a table. Do not colour every event: if everything is loud, nothing is.

## Designs

Pass one as the `variant` prop.

- `vertical` (Law of proximity): The default for order history and audit trails, where each event has time, a title and a line of detail.
- `alternate` (Rhythm and balance): For a story told on a wide page, such as a company history. Below 512 px of container it folds to one side by itself.
- `compact` (Information density): For an activity feed in a side panel, one line per event with the time lined up on the right.
- `horizontal` (Spatial mapping): For a few milestones across the top of a page, where left to right already reads as time. It scrolls inside itself when narrow.

## Effects

Pass one as the `effect` prop.

- `draw` (Goal gradient): On a page people scroll through once, such as a story or a launch history: each stretch of the line grows as it comes into view.

## Usage

```tsx
import { Timeline } from "@/components/ui/timeline"

<Timeline
  aria-label="Order history"
  effect="draw"
  events={[
    { time: "2 Nov, 14:02", dateTime: "2026-11-02T14:02", title: "Order placed", status: "success" },
    { time: "3 Nov, 09:12", title: "Delivery failed", body: "Nobody home", status: "error" },
    { time: "Today", title: "Second attempt", status: "current" },
  ]}
/>
```

Exports: `Timeline`
