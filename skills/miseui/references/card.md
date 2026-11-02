# Card

Bordered surface with header, content and footer slots that reads as one region before anyone reads the text.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/card.json
```

## Why it looks like this

**Law of common region.** Elements inside a shared border and background are grouped by the eye before a single word is read. Card wraps header, content and footer in one surface with a consistent 24 px inset, so related copy and controls are understood as belonging together.

**Don't.** Do not nest cards inside cards, and do not wrap a lone paragraph in one. When a region holds nothing but text, spacing alone groups it with far less visual weight.

## Usage

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Project</CardTitle>
    <CardDescription>Three open tasks</CardDescription>
  </CardHeader>
  <CardContent>…</CardContent>
  <CardFooter>…</CardFooter>
</Card>
```

Exports: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`
