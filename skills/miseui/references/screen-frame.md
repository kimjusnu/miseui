# Screen Frame

A window, a phone or a plain hairline around a screenshot or live interface.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/screen-frame.json
```

## Why it looks like this

**Framing effect.** A screenshot on a page has no edges of its own and can look like the page itself; a frame says this is a picture of a product. The bar holds the real address and no decorative buttons, so it adds meaning without adding noise.

**Don't.** Do not nest it inside a card with its own shadow, and do not frame small crops of a screen; crop tightly with no frame. A frame around a tiny phone screenshot on a phone only shrinks it further.

## Designs

Pass one as the `variant` prop.

- `browser` (Familiar metaphor): A website or web app, where the address itself tells people what they are looking at.
- `phone` (Scale cue): A mobile screen, where the tall slim outline says at once which device it is for.
- `plain` (Economy of emphasis): Many screens in a row or a detail of an interface, where repeated bars would be clutter.

## Effects

Pass one as the `effect` prop.

- `settle` (Staging): One hero screenshot on a landing page, which lays itself flat as it arrives and marks the moment.

## Usage

```tsx
import { ScreenFrame } from "@/components/ui/screen-frame"

<ScreenFrame src="/orders.png" alt="Orders table with two rows" url="https://shop.example.com/orders" />

<ScreenFrame variant="phone" src="/checkout.png" alt="Checkout on a phone" effect="settle" />

// Live interface instead of a picture
<ScreenFrame variant="plain"><OrdersTable /></ScreenFrame>
```

Exports: `ScreenFrame`, `displayAddress`
