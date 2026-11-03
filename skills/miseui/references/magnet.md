# Magnet

A wrapper that pulls any child toward the pointer from past its own bounds: the whole element, inner layers, a row by distance, or a soft ring that trails.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/magnet.json
```

## Why it looks like this

**Affordance.** Something that leans toward the pointer before it is reached says it can be pressed, and it says so while the pointer is still on its way. The pull is drawn with a transform on an inner element, so the layout box never changes and no invisible area takes clicks from a neighbour.

**Don't.** Keep it for one or two important actions on a page. A plain button that only needs a small lean belongs in Button with effect magnetic, which stays inside its own bounds. Nothing may depend on the pull: a finger or a keyboard never sees it.

## Designs

Pass one as the `variant` prop.

- `pull` (Affordance): The single main action of a hero or a landing section, where the whole button drifting toward the pointer is the invitation.
- `layers` (Motion parallax): A card or a large tile with an icon on top: inner parts travel further than the surface, which reads as depth without any 3D.
- `field` (Common fate): A row of social links or small tools: each one leans by its own distance, so the pointer seems to pass through a field. Wrap them in MagnetGroup.
- `halo` (Figure and ground): When the element must not move, such as a field label or a price: it stays exactly where it is and a soft ring trails the pointer around it.

## Effects

Pass one as the `effect` prop.

- `sticky` (Fitts's law): A small target that is worth reaching: it latches when the pointer is close and holds on until the pointer is well clear, with no jitter at the edge.

## Usage

```tsx
import { Magnet, MagnetGroup, MagnetLayer } from "@/components/ui/magnet"

<Magnet variant="pull" reach={96}>
  <Button>Start a project</Button>
</Magnet>

<Magnet variant="layers">
  <div className="rounded-xl border p-6">
    <MagnetLayer depth={2}><SparkIcon /></MagnetLayer>
    <p>New this week</p>
  </div>
</Magnet>

<MagnetGroup reach={120}>
  <Magnet><IconButton label="Mail"><Mail /></IconButton></Magnet>
  <Magnet><IconButton label="Feed"><Rss /></IconButton></Magnet>
</MagnetGroup>
```

Exports: `Magnet`, `MagnetGroup`, `MagnetLayer`
