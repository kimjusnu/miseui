# Image Trail

Pictures appear along the pointer's path and fade in order, pile up, fan out or slide past, with a still arrangement on touch so the box is never blank.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/image-trail.json
```

## Why it looks like this

**Direct manipulation.** People play with what answers them, and a trail turns moving the pointer into looking through a collection. Pictures spawn by distance, so the spacing stays even at any speed, and a fixed pool keeps the cost the same however long someone plays.

**Don't.** Keep it for portfolios, studios and event pages, where delight is part of the message. The pictures are decoration: they are hidden from assistive tech and never carry information or links. Show a real gallery with carousel or card-deck when people need to look at the work.

## Designs

Pass one as the `variant` prop.

- `trail` (Common fate): The default: small portrait pictures that pop in and leave in the order they came, so the line always has a head and a tail.
- `pile` (Law of proximity): A collection with a physical feel, like prints on a table: they stay stacked while the pointer moves and clear when it rests.
- `fan` (Rhythm): A playful or editorial page: tall cards fall at seeded angles from the path, like a hand of cards being dealt.
- `strip` (Continuity): Film, travel or anything sequential: upright frames of one size slide along the direction of travel.

## Effects

Pass one as the `effect` prop.

- `speed` (Feedback): When the gesture should feel physical: a fast sweep throws out larger pictures and a slow drift leaves small ones.

## Usage

```tsx
import { ImageTrail } from "@/components/ui/image-trail"

<ImageTrail
  variant="trail"
  className="h-96 rounded-xl border"
  items={photos.map((photo) => <img key={photo.src} src={photo.src} alt="" className="object-cover" />)}
>
  <h2>Places we walked this year</h2>
</ImageTrail>
```

Exports: `ImageTrail`
