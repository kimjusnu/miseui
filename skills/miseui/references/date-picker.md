# Date Picker

A calendar with no date library: single days or ranges, limits, a full keyboard grid and any locale, in four layouts.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/date-picker.json
```

## Why it looks like this

**Recognition over recall.** Few people know what weekday the 19th falls on, or how many nights a stay runs. A month laid out as a grid shows that without any counting, and days outside the allowed range are visibly closed before anyone tries them.

**Don't.** Do not make people page back through decades for a birth date: use the compact variant so they can type it. Do not offer a calendar for a date that has no meaning on a grid, such as a card expiry month.

## Designs

Pass one as the `variant` prop.

- `plain` (Progressive disclosure): In a form where a date is one field among several: a button that opens the calendar only when asked.
- `inline` (Visibility): When choosing a date is the main job of the screen, such as booking an appointment.
- `compact` (Flexibility and efficiency): For dates people already know, such as a birthday or a contract start: typing is faster, and the calendar stays one press away.
- `range` (Law of common region): For stays and reports: two months and one band, so a period that crosses a month end reads as one thing.

## Effects

Pass one as the `effect` prop.

- `slide` (Spatial continuity): When people page through months often: next always moves one way and previous the other, and a second press interrupts cleanly.

## Usage

```tsx
import { Calendar, DatePicker } from "@/components/ui/date-picker"

<DatePicker placeholder="Pick a delivery day" min={new Date()} onValueChange={setDay} />
<DatePicker variant="compact" aria-label="Date of birth" locale="en-GB" />
<DatePicker variant="range" effect="slide" name="stay" />

// Or just the grid
<Calendar mode="range" months={2} value={range} onValueChange={setRange} />
```

Exports: `DatePicker`, `Calendar`
