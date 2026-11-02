# Separator

A rule between groups of content, as a hairline, a dashed break, a labelled divider or a line that fades at both ends.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/separator.json
```

## Why it looks like this

**Law of uniform connectedness.** A line is the strongest way to say two things are apart, stronger than colour or size. One hairline between two groups does that job with almost no ink, so the content stays the loudest thing in the view.

**Don't.** Try spacing first: most groups separate on proximity alone, and a stack of rules turns a page into a form. Do not put a separator directly against a card edge, where the border already says the same thing.

## Designs

Pass one as the `variant` prop.

- `line` (Figure and ground): Between list rows and settings groups, where a single hairline is all the structure needed.
- `dashed` (Law of similarity): For a lesser break inside one group, such as the line above a total on a receipt.
- `label` (Signposting): When the break itself means something: a choice like Or, or a date in a message thread.
- `gradient` (Law of continuity): Between big sections of a marketing page, where fading ends avoid a hard edge against wide margins.

## Usage

```tsx
import { Separator } from "@/components/ui/separator"

<Separator />
<Separator variant="dashed" />
<Separator variant="label">Or continue with email</Separator>
<Separator variant="label" align="start">Yesterday</Separator>

<div className="flex items-center gap-3">
  Docs <Separator orientation="vertical" /> Pricing
</div>
```

Exports: `Separator`
