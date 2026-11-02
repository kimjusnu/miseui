# Calendar

A full-size calendar for showing what is on, as a month grid, a week strip, an agenda or a whole year.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/calendar.json
```

## Why it looks like this

**Spatial memory.** People remember dates by where they sit: the third week, the end of the row. Keeping every day in a fixed place lets them find a date by position and see how busy a stretch is before reading a single label.

**Don't.** Do not use it to choose one date in a form; that is the date picker. Do not show hours here: a timed schedule needs a time axis this view does not have.

## Designs

Pass one as the `variant` prop.

- `month` (Law of common region): The default planning view, when the shape of the month matters. Labels sit in the cells on wide screens and move under the grid on a phone.
- `week` (Chunking): When only the next few days matter, such as a team's week or a delivery schedule, so seven columns replace thirty cells.
- `agenda` (Serial position effect): When most days are empty, or on a phone: a list skips the blank days and reads top to bottom.
- `year` (Overview first, details on demand): For seeing where a year is busy, such as leave or release planning, and jumping to one month from there.

## Effects

Pass one as the `effect` prop.

- `slide` (Shared axis): When people page through periods: the new one comes from the side they pressed, and a quick second press reverses instead of waiting.

## Usage

```tsx
import { Calendar } from "@/components/ui/calendar"

const events = [
  { id: "review", title: "Design review", date: new Date(2026, 10, 12), detail: "Room 4" },
  { id: "trip", title: "Berlin trip", date: new Date(2026, 10, 18), end: new Date(2026, 10, 20) },
]

<Calendar events={events} effect="slide" onEventSelect={(event) => open(event.id)} />
<Calendar variant="agenda" events={events} locale="ko-KR" />
```

Exports: `Calendar`
