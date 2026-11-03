# Description List

Labels and values on a real dl, as ruled rows, two columns, single lines or tiles, with a slot for a copy button and long values that wrap.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/description-list.json
```

## Why it looks like this

**Visual hierarchy.** When someone looks up a value, the label only helps them find it, so the label stays small and muted and the value carries the weight. A real dl also tells a screen reader which label belongs to which value, which a pair of styled divs cannot do.

**Don't.** Do not use it to compare several records; that is a table. Do not use it for fields people edit, since a form with labels sets a different expectation. Keep labels short, or the eye has to read them instead of skipping past.

## Designs

Pass one as the `variant` prop.

- `stacked` (Law of continuity): In a narrow side panel or on a phone, where each value gets its full width and hairlines mark the rows.
- `columns` (Law of proximity): On a detail page with many short values, such as an invoice header, where two columns save a long scroll.
- `inline` (Law of alignment): For summaries and receipts, where right-aligned values line up and can be scanned or added up at a glance.
- `card` (Law of common region): When a few key facts should stand apart at the top of a page, each in its own tile with a larger value.

## Usage

```tsx
import { DescriptionList, DescriptionItem } from "@/components/ui/description-list"
import { Clipboard } from "@/components/ui/clipboard"

<DescriptionList variant="stacked">
  <DescriptionItem label="Invoice" action={<Clipboard value="INV-2041" label="Copy invoice number" />}>
    INV-2041
  </DescriptionItem>
  <DescriptionItem label="Billed to">Mina Park</DescriptionItem>
</DescriptionList>
```

Exports: `DescriptionList`, `DescriptionItem`
