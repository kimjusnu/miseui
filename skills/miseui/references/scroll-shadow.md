# Scroll Shadow

A wrapper for any scrolling box that shows edge shadows, fades or hairlines from the real scroll position, so people can see there is more.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/scroll-shadow.json
```

## Why it looks like this

**Signifiers.** Phones and many laptops hide scrollbars, so a list that happens to end at the edge of its box looks finished. A mark at an edge says there is more this way, and it goes as soon as there is not, because it reads the real position. The native scrollbar stays, so nothing about how the box scrolls changes.

**Don't.** Do not use it for a box that never overflows, or for the whole page; a browser already handles that. For a custom scrollbar use scroll-area instead, which replaces the bar. This one leaves it alone.

## Designs

Pass one as the `variant` prop.

- `shadow` (Depth cues): On lists inside a card or a side panel, where a soft shadow says the content passes under the edge.
- `fade` (Common fate): On any background, including images and gradients, because the content itself dissolves and no colour has to match.
- `line` (Minimal signifier): In calm, flat interfaces such as a dialog body, where a single hairline appears the moment content moves under it.
- `none-at-rest` (Temporal contiguity): On a surface that must look clean in a screenshot or at rest. Marks appear only while scrolling, so pair it with content cut mid-line.

## Usage

```tsx
import { ScrollShadow } from "@/components/ui/scroll-shadow"

<ScrollShadow className="h-64" aria-label="Release notes">
  {notes}
</ScrollShadow>

// Sideways, with your own element as the scroller
<ScrollShadow axis="x" variant="fade" asChild>
  <ul className="flex gap-2">{chips}</ul>
</ScrollShadow>
```

Exports: `ScrollShadow`
