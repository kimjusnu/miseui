# Action Bar

Appears when items are selected, with the count, the actions and a way to clear, floating over the page, docked to its edge or sitting in the flow.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/action-bar.json
```

## Why it looks like this

**Progressive disclosure.** Bulk actions mean nothing until something is chosen, so they stay out of the way and arrive at the moment they apply. The count confirms what the next click will touch, which is what makes a bulk delete feel safe, and Escape gives a quick way back from a selection made by mistake.

**Don't.** Do not use it for actions that work without a selection; those belong in a toolbar. Do not place a fixed bar inside a transformed parent, since a transform turns fixed into absolute, and leave room at the end of the list so the bar never covers its last row.

## Designs

Pass one as the `variant` prop.

- `floating` (Figure and ground): Over long tables and grids, where an island stays in reach without taking a row of the layout.
- `docked` (Fitts's law): On phones and in admin screens with many actions: a full-width bar has the room, and an edge is the easiest target there is.
- `inline` (Law of proximity): In a list header or a card, replacing the header while a selection exists, so the actions sit right above what they affect.
- `compact` (Aesthetic-usability effect): In small panels and media grids with two or three well-known actions that a glyph can carry.

## Effects

Pass one as the `effect` prop.

- `spring` (Spatial consistency): When the bar comes and goes as people select: it rises from the edge it belongs to, and a quick reselect reverses instead of jumping.

## Usage

```tsx
import { ActionBar, ActionBarAction } from "@/components/ui/action-bar"
import { Archive, Trash2 } from "lucide-react"

<ActionBar count={selected.length} onClear={() => setSelected([])} effect="spring">
  <ActionBarAction icon={<Archive />} onClick={archive}>Archive</ActionBarAction>
  <ActionBarAction icon={<Trash2 />} tone="destructive" onClick={remove}>Delete</ActionBarAction>
</ActionBar>

<ActionBar variant="inline" count={selected.length} onClear={clear} countLabel={(count) => count + " files"}>
  <ActionBarAction onClick={archive}>Archive</ActionBarAction>
</ActionBar>
```

Exports: `ActionBar`, `ActionBarAction`, `shouldClearOnEscape`
