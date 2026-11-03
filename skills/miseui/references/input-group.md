# Input Group

One field with text, icons, buttons or a select attached to it, sharing a single border and focus ring, in four layouts.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/input-group.json
```

## Why it looks like this

**Law of uniform connectedness.** A currency code or a domain is part of the value, so it should look like part of the field. One border and one focus ring around everything make it read as a single thing to fill in, and showing the unit in the field saves people from guessing what to type.

**Don't.** Do not turn a whole form into one group. Do not put two inputs in one group, as people lose track of which one is focused. An addon is not a label: the field still needs a name, which the `label` prop gives it.

## Designs

Pass one as the `variant` prop.

- `attached` (Law of common region): When the addon is a fixed part of the value, such as a protocol, a domain or a unit, and should look different from what is typed.
- `inset` (Figure and ground): For search and short commands, where the icon and a small button stay inside and the field keeps one clean surface.
- `stacked` (Law of proximity): For payment and checkout forms: the label stays visible while typing, and it saves the vertical space of a separate line.
- `inline` (Law of alignment): For settings rows on a phone, with the label on the left and the value right-aligned, as system settings do.

## Usage

```tsx
import {
  InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton, InputGroupSelect,
} from "@/components/ui/input-group"

<InputGroup label="Website">
  <InputGroupAddon>https://</InputGroupAddon>
  <InputGroupInput placeholder="yoursite.com" />
  <InputGroupButton>Check</InputGroupButton>
</InputGroup>

<InputGroup variant="stacked" label="Monthly budget">
  <InputGroupInput inputMode="decimal" placeholder="0.00" />
  <InputGroupSelect aria-label="Currency">
    <option>USD</option>
    <option>KRW</option>
  </InputGroupSelect>
</InputGroup>
```

Exports: `InputGroup`, `InputGroupAddon`, `InputGroupInput`, `InputGroupButton`, `InputGroupSelect`
