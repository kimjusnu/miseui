# Popover

Small floating panel anchored to the control that opened it, for a form or detail that does not need a full dialog.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/popover.json
```

## Why it looks like this

**Spatial memory.** People remember where things are better than what they said. The popover opens beside its trigger and zooms out from that edge, so the eye never searches for the new content and its link to the control is obvious. A click anywhere else closes it and focus returns to the trigger.

**Don't.** Do not use it for destructive confirmations or anything the user must not miss; it is easy to dismiss by accident, so use a Dialog. For a plain text hint a Tooltip is lighter.

## Effects

Pass one as the `effect` prop.

- `materialize` (Spatial continuity): Use it when a panel holds richer content and people should feel it came from the button they pressed, not from nowhere.

## Usage

```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Filters</Button>
  </PopoverTrigger>
  <PopoverContent align="start">
    <p className="text-sm font-medium">Show only</p>
    <p className="text-sm text-muted-foreground">Open issues assigned to you.</p>
  </PopoverContent>
</Popover>

// <PopoverContent effect="materialize"> grows the panel out of its trigger with scale, blur and opacity together.
```

Exports: `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverAnchor`
