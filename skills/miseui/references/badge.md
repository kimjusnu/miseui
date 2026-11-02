# Badge

Small status chip in five variants; the warm mise variant is reserved for the one item that must stand out.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/badge.json
```

## Why it looks like this

**Von Restorff effect.** In a row of similar items, the one that differs is the one people notice and remember. Badge ships four quiet variants and one warm mise variant, so you can mark the single item that deserves attention without raising the volume of everything around it.

**Don't.** Do not put the mise variant on more than one badge per view, and do not use a badge as a button. If it needs a click, wrap a link with asChild or use Button.

## Usage

```tsx
import { Badge } from "@/components/ui/badge"

<Badge>Draft</Badge>
<Badge variant="mise">New</Badge>
<Badge asChild variant="outline">
  <a href="/changelog">v0.2</a>
</Badge>
```

Exports: `Badge`, `badgeVariants`
