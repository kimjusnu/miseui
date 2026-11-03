# Status

A state word with a mark that means something: online, away, busy, offline, error or your own, each with its own shape as well as its own hue.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/status.json
```

## Why it looks like this

**Redundant coding.** One in twelve men cannot reliably tell red from green, so a coloured dot alone leaves them guessing. Each state here has its own shape and its own word, which also makes the meaning survive a greyscale screenshot or a printed page.

**Don't.** Do not use it for counts or categories; a tag or an indicator fits those. Do not invent a new meaning for a familiar colour, because people read green as fine whatever the word beside it says.

## Designs

Pass one as the `variant` prop.

- `dot` (Signal to noise): Beside a name in a dense list, where the word would repeat on every row. The word stays available to assistive tech.
- `badge` (Pre-attentive processing): In a table column or a card header, when the state should be found at a glance while scanning.
- `pill` (Law of common region): On a busy surface such as a header or an image, where a bordered capsule keeps the state together and readable.
- `plain` (Figure and ground): Inside a sentence or a detail row, with the extra context beside it, where any surface would be too loud.

## Effects

Pass one as the `effect` prop.

- `pulse` (Motion marks change): Only for a state that is happening right now, such as a live connection or a recording. It stops under reduced motion, and off states never pulse.

## Usage

```tsx
import { Status } from "@/components/ui/status"

<Status state="online" variant="badge" effect="pulse" />
<Status state="away" detail="back at 3 pm" />
<Status state="busy" variant="dot" />
<Status state="custom" tone="warning" variant="pill">Degraded</Status>
```

Exports: `Status`
