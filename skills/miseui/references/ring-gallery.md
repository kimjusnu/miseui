# Ring Gallery

A small set of items on a 3D ring: drag to spin, click to bring one forward, arrow keys to walk around it.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/ring-gallery.json
```

## Why it looks like this

**Von Restorff effect.** One item stands forward and everything else recedes, so the eye has one place to land while the rest stay visibly close by. The spin is direct manipulation: the ring follows the finger, which makes a small collection feel worth exploring.

**Don't.** Do not use it for more than about twelve items or for anything people must compare side by side: most of the ring is out of view. It is a showcase, so a plain list is the honest choice for working data.

## Designs

Pass one as the `variant` prop.

- `ring` (Depth cues): For cards with a short name, seen slightly from above, where the far side of the ring shows blank backs.
- `medallion` (Figure and ground): For round marks such as badges or logos, which keep facing the viewer so every one stays recognisable at the back.
- `cylinder` (Immersion): For larger panels such as rooms or chapters, where neighbours curve towards the viewer and the far side stays out of sight.

## Effects

Pass one as the `effect` prop.

- `momentum` (Direct manipulation): When the set is browsed for pleasure: a flick spins past several items and settles where it would come to rest, while the default moves one at most.

## Usage

```tsx
import { RingGallery } from "@/components/ui/ring-gallery"

const items = [
  { id: "first", label: "First deploy", detail: "Shipped to production", media: <Rocket className="size-6" /> },
  { id: "review", label: "Ten reviews", detail: "Reviewed ten changes", media: <Eye className="size-6" /> },
]

<RingGallery label="Badges" items={items} variant="medallion" effect="momentum" />
```

Exports: `RingGallery`
