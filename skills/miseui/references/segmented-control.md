# Segmented Control

A short set of mutually exclusive views, always one on, as a thumb in a track, chips, an underline or square icons.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/segmented-control.json
```

## Why it looks like this

**Recognition over recall.** All the options sit on screen and exactly one is on, so nobody has to open anything or remember what else there was. Because it behaves like a radio group, one press changes the view at once and the arrow keys move through the options.

**Don't.** Do not use it past about five options or for long labels; use a select. Do not use it to navigate between pages or panels of different content, which is what tabs are for. If nothing being selected is a valid state, use a toggle group.

## Designs

Pass one as the `variant` prop.

- `plain` (Figure and ground): The default for switching a view in a toolbar or a chart header, where the raised thumb stands out from the sunken track.
- `pill` (Law of similarity): Above a list or on a marketing page, where a strong solid chip makes the chosen option the first thing seen.
- `underline` (Economy of attention): Inside a dense panel or a card header, where a line carries the state without adding another surface.
- `icon` (Picture superiority): For well-known choices like list and grid or text alignment, where glyphs save width. Give each one an aria-label.

## Effects

Pass one as the `effect` prop.

- `spring` (Spatial continuity): When switching often: one thumb slides over and shows where the choice went. It lives inside the chosen option, so it stays aligned when the control resizes.

## Usage

```tsx
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control"

<SegmentedControl aria-label="Range" defaultValue="week" effect="spring">
  <SegmentedControlItem value="day">Day</SegmentedControlItem>
  <SegmentedControlItem value="week">Week</SegmentedControlItem>
  <SegmentedControlItem value="month">Month</SegmentedControlItem>
</SegmentedControl>
```

Exports: `SegmentedControl`, `SegmentedControlItem`
