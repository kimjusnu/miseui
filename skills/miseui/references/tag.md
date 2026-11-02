# Tag

A short label that can also be pressed or removed: soft tint, outline, solid or a status dot, with status tones that never borrow the accent.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/tag.json
```

## Why it looks like this

**Pre-attentive processing.** A small coloured shape is picked out of a list before anyone reads it, so state and category can be scanned down a page. Status colours are fixed, so success stays green even when the theme accent is amber or red. A remove button is a separate target, so taking a tag off never fires the action of the label.

**Don't.** Do not rely on colour alone; the word has to say it too. Do not use a tag as a primary button, and do not stack so many on a row that nothing stands out. For a count or a small status on an object, a badge is usually enough.

## Designs

Pass one as the `variant` prop.

- `soft` (Figure and ground): The default in tables and cards, where many tags appear at once and each should stay quiet.
- `outline` (Economy of attention): For categories and topics that carry no status, or on tinted surfaces where another fill would clash.
- `solid` (Von Restorff effect): For the one label that should stand out, such as Overdue. Use it rarely, because it loses its power when repeated.
- `dot` (Signal to noise): For status in a dense list, where a dot marks the state and the text stays in normal ink. Every dot colour means a state.

## Effects

Pass one as the `effect` prop.

- `collapse` (Object constancy): For tags people remove one after another: the row slides shut, so they can see where the rest went and carry on without hunting.

## Usage

```tsx
import { Tag } from "@/components/ui/tag"

<Tag tone="success">Paid</Tag>
<Tag variant="dot" tone="warning">Pending</Tag>
<Tag onClick={toggle} pressed={active}>Design</Tag>
<Tag effect="collapse" removeLabel="Remove design" onRemove={removeDesign}>Design</Tag>
```

Exports: `Tag`
