# useViewTransition

Five named page-transition presets on the View Transitions API, with a reduced-motion cross-fade and a plain fallback.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/use-view-transition.json
```

## Why it looks like this

**Wayfinding · spatial memory.** Each preset tells a spatial story: siblings slide along one axis, a detail scales up out of its list, a replaced screen fades through a neutral frame. Picking the preset that matches the navigation keeps the user's mental map intact, so they always know where they are and how to get back.

**Don't.** Do not mix presets for the same kind of navigation, and never slide in one direction and dismiss in another; the exit must mirror the entry.

## Usage

```tsx
import { useViewTransition } from "@/hooks/use-view-transition"

const transition = useViewTransition("shared-axis-x")

<button onClick={() => transition(() => setTab("details"))}>Details</button>
```

Exports: `useViewTransition`, `STYLE_ELEMENT_ID`
