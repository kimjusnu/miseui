# Gooey Morph

Status dots that merge into one body and split apart again like a liquid, so the eye tracks one thing changing.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/gooey-morph.json
```

## Why it looks like this

**Object permanence.** When several steps collapse into one summary, or one task fans out into parts, dots that simply appear and disappear look like different things. Dots that flow together and apart as one substance read as the same object changing shape, which is what actually happened. The spring settles without bounce, so the merge looks decided, not playful.

**Don't.** Do not use it as decoration with nothing merging. Keep it to four items or fewer; past that the blob stops reading as a group of things.

## Usage

```tsx
import { GooeyMorph } from "@/components/ui/gooey-morph"

<GooeyMorph
  merged={isCollapsed}
  items={[
    { id: "plan", label: "Plan" },
    { id: "search", label: "Search" },
    { id: "write", label: "Write" },
  ]}
/>
```

Exports: `GooeyMorph`
