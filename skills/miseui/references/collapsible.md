# Collapsible

One disclosure: a label that opens the detail under it, for the one thing most readers can skip.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/collapsible.json
```

## Why it looks like this

**Progressive disclosure.** A single optional detail costs attention even when nobody needs it. Folding it behind a clear label keeps the main path short, and the detail opens exactly where the reader is looking, so nothing has to be found again.

**Don't.** Do not fold what most readers need, and do not use several in a row; that list is an accordion. The fade variant needs text clearly longer than its collapsed height, otherwise Show more opens almost nothing.

## Designs

Pass one as the `variant` prop.

- `plain` (Figure and ground): Inside a form or a settings group, where a full-width row reads as one more line of the same list.
- `card` (Law of common region): When the detail stands alone on the page and needs its own surface to read as one object.
- `fade` (Curiosity gap): On long text such as a job post or a release note, where a real preview tells readers whether more is worth a click.
- `inline` (Visual hierarchy): Under a price or a result, for a small why-is-this question that should not compete with the content above it.

## Effects

Pass one as the `effect` prop.

- `spring` (Interruptibility): When people may change their mind mid-open: the height continues from where it is and reverses without a jump.

## Usage

```tsx
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"

<Collapsible variant="card" effect="spring">
  <CollapsibleTrigger>Billing details</CollapsibleTrigger>
  <CollapsibleContent>Paid by card ending 4242.</CollapsibleContent>
</Collapsible>

<Collapsible variant="fade">
  <CollapsibleContent collapsedHeight={96}>{longText}</CollapsibleContent>
  <CollapsibleTrigger />
</Collapsible>
```

Exports: `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`
