# Aspect Ratio

Holds the space for media before it arrives, so the page does not jump, with a mat, an overlaid caption or an empty slot.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/aspect-ratio.json
```

## Why it looks like this

**Layout stability.** An image with no reserved height pushes everything below it down when it loads, often just as someone reaches for a link. Reserving the box from the ratio keeps the page where the reader left it, and it also keeps a grid of mixed photos in even rows.

**Don't.** Do not force a ratio on media whose full frame matters, such as a chart or a screenshot, because object-cover crops the edges. Use the image at its own ratio there.

## Designs

Pass one as the `variant` prop.

- `plain` (Figure and ground): In a gallery or a card, where the photo is the only thing to look at and any frame would compete with it.
- `framed` (Law of common region): When a caption has to stay with its picture in a long article, so a mat holds the two together as one object.
- `overlay` (Visual hierarchy): On a tile that links somewhere, where the title reads as part of the picture and there is no room below it.
- `placeholder` (Signifiers): In an editor or a template, where the dashed slot says something belongs here and at what shape.

## Effects

Pass one as the `effect` prop.

- `reveal` (Perceived performance): When photos load over a slow connection: nothing paints from the top down, the image comes into focus once it is whole.

## Usage

```tsx
import { AspectRatio } from "@/components/ui/aspect-ratio"

<AspectRatio ratio={16 / 9} effect="reveal">
  <img src="/harbour.jpg" alt="Boats in the harbour at dusk" />
</AspectRatio>

<AspectRatio variant="overlay" ratio={4 / 3} caption="Harbour at dusk">…</AspectRatio>
<AspectRatio variant="placeholder" ratio={1} />
```

Exports: `AspectRatio`, `ratioLabel`
