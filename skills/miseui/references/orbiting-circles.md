# Orbiting Circles

Small things travelling around a centre: one orbit, several at different speeds, a tilted ellipse that passes behind or an arch at the foot of a hero. Focus and pointing stop it.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/orbiting-circles.json
```

## Why it looks like this

**Gestalt common region.** Things sharing an orbit read as one family that belongs to whatever sits in the middle, which says connects with all of these without a diagram. The slow motion gives a static row of icons some life, and it stops as soon as someone reaches for an item, so nothing has to be chased.

**Don't.** Do not put anything here that people must find quickly: a moving target is the slowest thing to hit, so a plain list is always better for navigation. Keep it to about eight items, and leave out the links if there is no reason to press them.

## Designs

Pass one as the `variant` prop.

- `ring` (Symmetry): A feature section about one product and what it connects to, where one clean circle is the whole statement.
- `rings` (Visual hierarchy): When items come in tiers, such as core tools inside and add-ons outside. Opposite directions keep the tiers apart.
- `tilted` (Depth cue): A wide, short space beside a headline. Items passing behind the centre make it read as an object in space, and it needs little height.
- `arc` (Focal point): The foot of a hero, with a sentence or a button inside the arch. Items rise over it and leave, so they frame the text and do not compete.

## Effects

Pass one as the `effect` prop.

- `hover` (Progressive disclosure): When an icon alone is not enough: pointing at or focusing an item stops the orbit and shows its name, and a tap does the same on a phone.

## Usage

```tsx
import { OrbitingCircles } from "@/components/ui/orbiting-circles"
import { Mail, FileText, Calendar } from "lucide-react"

const items = [
  { id: "mail", label: "Mail", icon: <Mail />, href: "/connect/mail" },
  { id: "files", label: "Files", icon: <FileText /> },
  { id: "calendar", label: "Calendar", icon: <Calendar /> },
]

<OrbitingCircles label="Connected apps" items={items} center={<Logo />} paused={paused} className="max-w-80" />

<OrbitingCircles variant="arc" effect="hover" items={items} center={<p>Everything in one place</p>} />
```

Exports: `OrbitingCircles`
