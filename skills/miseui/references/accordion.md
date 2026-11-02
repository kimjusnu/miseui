# Accordion

Stacked rows that open in place, so a long page of answers stays short until someone asks for one.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/accordion.json
```

## Why it looks like this

**Progressive disclosure.** People scan questions before they read answers. Showing only the rows keeps the whole list in view and lets each reader open the one line that matters to them, with the answer appearing exactly where they were looking.

**Don't.** Do not hide what most readers need; if nearly everyone opens a row, it should be plain text. Do not put required form fields inside closed rows, and do not nest accordions.

## Designs

Pass one as the `variant` prop.

- `plain` (Figure and ground): Inside a page or a settings column, where hairlines separate rows without adding a second surface.
- `card` (Law of common region): When the rows are one topic sitting among other content, so one rounded container says they belong together.
- `separated` (Law of proximity): When rows are independent items such as tickets or steps, and the open one should lift away from the rest.
- `flush` (Visual hierarchy): On a marketing FAQ, where large questions carry the page and borders would only add noise.

## Effects

Pass one as the `effect` prop.

- `spring` (Interruptibility): When people open and close rows quickly: the height continues from where it is, so a second click reverses instead of jumping.

## Usage

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

<Accordion variant="separated" effect="spring" defaultValue="refunds">
  <AccordionItem value="refunds">
    <AccordionTrigger>How do refunds work?</AccordionTrigger>
    <AccordionContent>They land in five working days.</AccordionContent>
  </AccordionItem>
</Accordion>

<Accordion type="multiple" variant="flush" icon="plus">…</Accordion>
```

Exports: `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`
