# Card

Bordered surface with header, content and footer slots that reads as one region before anyone reads the text.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/card.json
```

## Why it looks like this

**Law of common region.** Elements inside a shared border and background are grouped by the eye before a single word is read. Card wraps header, content and footer in one surface with a consistent 24 px inset, so related copy and controls are understood as belonging together.

**Don't.** Do not nest cards inside cards, and do not wrap a lone paragraph in one. When a region holds nothing but text, spacing alone groups it with far less visual weight. Keep to one beam or tilt card per screen, and skip materialize on server-rendered content: the card holds nothing until the client has mounted.

## Effects

Pass one as the `effect` prop. The plain component stays the default.

- `beam` (Selective attention): On the one card the model is writing into, so the eye knows where the answer will land.
- `spotlight` (Perceived affordance): On a grid of clickable cards reached with a mouse, where the light under the pointer says which one would respond.
- `tilt` (Direct manipulation): On a single showcase card, where a surface that answers the hand earns a second look.
- `materialize` (Spatial continuity): On a card that appears as the result of an action, so it reads as arriving, not as a jump in the layout.

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

<Card effect="spotlight">…</Card>
```

Exports: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`
