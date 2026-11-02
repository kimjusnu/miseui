# Badge

Small status chip in five variants; the warm mise variant is reserved for the one item that must stand out.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/badge.json
```

## Why it looks like this

**Von Restorff effect.** In a row of similar items, the one that differs is the one people notice and remember. Badge ships four quiet variants and one warm mise variant, so you can mark the single item that deserves attention without raising the volume of everything around it.

**Don't.** Do not put the mise variant on more than one badge per view, and do not use a badge as a button. If it needs a click, wrap a link with asChild or use Button. Keep to one glow or beam badge per view, and keep a beam badge out of a paragraph: its frame is a div, which a p cannot hold.

## Effects

Pass one as the `effect` prop. The plain component stays the default.

- `glow` (Von Restorff effect): On the single badge that must be noticed first, such as a new feature in a long list.
- `beam` (Selective attention): On the one item the model is working on right now, while its siblings stay quiet.
- `count` (Object constancy): On counters that change while being watched, so the eye sees one number changing rather than one swapped for another.
- `live` (Visibility of system status): On anything happening in real time, such as recording or streaming, where the state must be felt without reading.

## Usage

```tsx
import { Badge } from "@/components/ui/badge"

<Badge>Draft</Badge>
<Badge variant="mise">New</Badge>
<Badge effect="count">{unread}</Badge>
<Badge asChild variant="outline">
  <a href="/changelog">v0.2</a>
</Badge>
```

Exports: `Badge`, `badgeVariants`
