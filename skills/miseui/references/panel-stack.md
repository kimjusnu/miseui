# Panel Stack

A story told one panel at a time with a page count and a progress line, in the page or over the whole screen.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/panel-stack.json
```

## Why it looks like this

**Serial position effect.** One idea per screen holds attention better than a long scroll, and an order only exists when the reader can see it. The count and the line say how much is left, which is the question that decides whether someone keeps going.

**Don't.** For a row of equal things to browse in any order, use a carousel. Do not hide anything essential past the first panel; many people will not turn the page.

## Designs

Pass one as the `variant` prop.

- `deck` (Single focus): A short sequence inside a page, such as a process in three steps, with one panel filling the column.
- `peek` (Affordance): Phones and narrow columns: the edge of the next panel says there is more, with no explanation needed.
- `overlay` (Change of context): The details of one case study from a list: the whole screen slides over, and going back returns you to where you were.

## Effects

Pass one as the `effect` prop.

- `wheel` (Natural mapping): In the overlay, where the wheel otherwise has nothing to do: one gesture turns one panel. In a page, it would stop people scrolling past.

## Usage

```tsx
import { PanelStack } from "@/components/ui/panel-stack"

const panels = [
  { title: "The problem", kicker: "Start here", content: <p>Half of teams never invited anyone.</p> },
  { title: "The result", content: <p>Two out of three now do.</p> },
]

<PanelStack panels={panels} label="Case study" variant="peek" />

<PanelStack panels={panels} label="Case study" variant="overlay" effect="wheel" trigger={<Button>Read the case study</Button>} />
```

Exports: `PanelStack`, `wheelStep`, `nearestPanel`
