# Listbox

A list you choose from that stays open, for when seeing every option is the point.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/listbox.json
```

## Why it looks like this

**Recognition over recall.** A closed select asks people to remember what is inside it. A listbox keeps the choices in view, so they can compare them without opening anything, and keyboard users can jump by typing the first letters as they would in a file list.

**Don't.** Do not use it for more than about a dozen options without a search; that is a combobox. Do not use it for two or three choices, where radio buttons read faster, or for commands, which belong in a menu.

## Designs

Pass one as the `variant` prop.

- `plain` (Figure and ground): Inside a side panel or a settings column, where one filled row is enough to mark the choice.
- `check` (Signifiers): When several can be chosen: checkboxes say so before the first click, and a single check keeps rows from shifting.
- `card` (Law of common region): When each choice needs a sentence, such as plans or delivery options, and deserves its own surface.
- `compact` (Information density): For long technical lists such as columns or time zones, where seeing more rows matters more than air.

## Effects

Pass one as the `effect` prop.

- `spring` (Object constancy): When the choice changes often and something else reacts to it: one highlight travels to the new row, so the eye follows the change.

## Usage

```tsx
import { Listbox } from "@/components/ui/listbox"

const options = [
  { value: "standard", label: "Standard", description: "Three to five days" },
  { value: "express", label: "Express", description: "Next day" },
  { value: "pickup", label: "Pick up", disabled: true },
]

<Listbox aria-label="Delivery" options={options} variant="card" effect="spring" defaultValue="standard" />
<Listbox aria-label="Columns" options={options} variant="check" multiple onValueChange={setColumns} />
```

Exports: `Listbox`
