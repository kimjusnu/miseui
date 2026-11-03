# Spotlight

A surface that catches a soft light under the pointer, on its face, on its edge or by uncovering a hidden layer.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/spotlight.json
```

## Why it looks like this

**Affordance through response.** A surface that answers the pointer feels physical, and it hints that this card is the one being pointed at without any layout change. The light fades out on leaving and never appears for a finger, so nothing depends on it.

**Don't.** Never put information under the light: touch screens and keyboards will not see it. Skip it on dense tables and on anything people use all day, where a moving glow becomes noise.

## Designs

Pass one as the `variant` prop.

- `glow` (Figure and ground): Single feature cards on a marketing page, where a soft wash lifts the card without any border change.
- `border` (Economy of emphasis): Dense grids of cards and dark interfaces, where a lit edge is enough and a filled glow would muddy the text.
- `reveal` (Discovery): A hero tile or an empty panel, where finding a pattern under the pointer is a small reward and hides nothing needed.

## Effects

Pass one as the `effect` prop.

- `trail` (Perceived weight): On large surfaces, where a light that lags a little reads as an object in the room and not as a cursor attachment.

## Usage

```tsx
import { Spotlight, SpotlightGroup } from "@/components/ui/spotlight"

<Spotlight className="p-4">Team plan</Spotlight>

// One pointer lights the edges of every card it is near
<SpotlightGroup className="grid gap-2 sm:grid-cols-3">
  <Spotlight variant="border" className="p-4">Analytics</Spotlight>
  <Spotlight variant="border" className="p-4">Billing</Spotlight>
  <Spotlight variant="border" className="p-4">Support</Spotlight>
</SpotlightGroup>
```

Exports: `Spotlight`, `SpotlightGroup`
