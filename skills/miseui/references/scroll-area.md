# Scroll Area

A scroller with a styled bar that matches the theme, as a hover bar, a thin overlay, edge shadows or a snapping row.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/scroll-area.json
```

## Why it looks like this

**Law of continuity.** A panel that cuts off cleanly looks finished, so people miss what is below it. Each design here says there is more in its own way, and the scroller stays reachable by keyboard, which a hand-rolled overflow box usually forgets.

**Don't.** Do not nest scrollers along the same axis; the inner one traps the wheel. Do not use one for the whole page, where the browser's own bar is what people know. Give it a height, or it has nothing to scroll.

## Designs

Pass one as the `variant` prop.

- `plain` (Signifiers): For side panels and long lists on desktop, where a bar in its own gutter appears when the pointer enters.
- `overlay` (Aesthetic and minimalist design): In tight popovers and menus: a thin bar floats over the content only while scrolling, and widens when reached for.
- `shadow` (Depth cue): In a table or a modal body, where a soft shadow at an edge shows there is more behind it and fades as you arrive.
- `snap` (Law of closure): For a row of cards on a phone: each flick lands on a card, and the next one peeking in invites the swipe.

## Effects

Pass one as the `effect` prop.

- `edge-fade` (Figure and ground): Over text or images on a plain background, where content dissolves into the surface instead of being cut off.

## Usage

```tsx
import { ScrollArea } from "@/components/ui/scroll-area"

<ScrollArea className="h-64" aria-label="Release notes" effect="edge-fade">
  {notes}
</ScrollArea>

<ScrollArea variant="shadow" className="h-64">{rows}</ScrollArea>

<ScrollArea variant="snap" aria-label="Plans">
  <PlanCard className="w-64" />
  <PlanCard className="w-64" />
</ScrollArea>
```

Exports: `ScrollArea`, `edgeProgress`
