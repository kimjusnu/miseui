# Carousel

A row of slides on the browser's own scroll snapping, so swiping feels native and no library is needed.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/carousel.json
```

## Why it looks like this

**Direct manipulation.** The slides are a real scroller, so a finger moves them one to one, momentum and edges behave like every other list on the device, and nothing has to imitate physics. Buttons and arrow keys drive that same scroller, so every way of moving lands in the same place.

**Don't.** Do not hide anything important past the first slide: most people never advance. Do not use it to pack a hero with several messages, and leave autoplay off unless the slides are ambient.

## Designs

Pass one as the `variant` prop.

- `plain` (Focal point): One thing at a time, such as a product tour, with the title and count underneath saying where you are.
- `peek` (Affordance): On touch screens and in content feeds: a sliver of the neighbours says this scrolls before anyone tries it.
- `cards` (Depth cue): For a small deck of offers or passes, where the stack shows how many are left and the top card has the attention.
- `thumbnails` (Recognition over recall): For galleries, where people look for a picture they recognise and jump to it instead of paging through.

## Effects

Pass one as the `effect` prop.

- `parallax` (Motion parallax): Only on full-bleed pictures in media: they drift slightly against the swipe, which adds depth without moving any text someone is reading.

## Usage

```tsx
import { Carousel } from "@/components/ui/carousel"

const items = [
  { id: "harbour", label: "Harbour at dawn", media: <img src="/harbour.jpg" alt="" /> },
  { id: "market", label: "Fish market", content: <MarketCard /> },
]

<Carousel label="Trip photos" items={items} variant="peek" />
<Carousel label="Trip photos" items={items} variant="thumbnails" effect="parallax" />
<Carousel label="Announcements" items={items} autoplay interval={8000} loop />
```

Exports: `Carousel`
