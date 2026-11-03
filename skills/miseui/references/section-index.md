# Section Index

A numbered map of the chapters in a long read that fills as you go, as a rail, a sticky strip or a one-line counter.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/section-index.json
```

## Why it looks like this

**Goal gradient effect.** People keep going when they can see how far they have come, so finished chapters stay filled instead of a marker just moving. It tracks whole sections, not headings, which is what lets it say how much of the current one is left.

**Don't.** For documentation with nested headings read from the page, use a table of contents: this one is a flat list of chapters you name yourself. Three chapters or fewer do not need an index at all.

## Designs

Pass one as the `variant` prop.

- `rail` (Goal gradient effect): A sticky side column beside a case study on a wide screen.
- `strip` (Economy of space): A sticky bar on a phone, where the chapters run sideways and the current one scrolls into view by itself.
- `counter` (Progress at a glance): When there is room for one line only: where you are out of how many, with steps to the next and previous chapter.

## Effects

Pass one as the `effect` prop.

- `progress` (Feedback through continuity): Long chapters, where the mark would otherwise sit unchanged for minutes and look stuck.

## Usage

```tsx
import { SectionIndex } from "@/components/ui/section-index"

<SectionIndex
  effect="progress"
  items={[
    { id: "problem", title: "The problem" },
    { id: "approach", title: "The approach" },
    { id: "result", title: "The result" },
  ]}
/>

<section id="problem">...</section>
<section id="approach">...</section>
<section id="result">...</section>
```

Exports: `SectionIndex`
