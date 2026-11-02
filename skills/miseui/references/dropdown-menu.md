# Dropdown Menu

Compact menu of actions that opens from a button and closes on choice, with arrow-key navigation and a destructive variant.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/dropdown-menu.json
```

## Why it looks like this

**Hick's law.** Decision time grows with the number of options in view. Folding secondary actions into a menu leaves the one primary button on screen, and when the menu opens each item is a single labelled row the arrow keys can walk. Keep it to seven items or fewer; past that, group with a label and separator or move actions elsewhere.

**Don't.** Do not hide the primary action in a menu, and do not use it to navigate between pages or to pick a value; Tabs and Select exist for those.

## Effects

Pass one as the `effect` prop. The plain component stays the default.

- `materialize` (Spatial continuity): Use it for a menu opened now and then from one prominent button, so it clearly belongs to what was pressed.
- `spring` (Object constancy): Use it for a menu people browse before choosing, where one travelling highlight keeps the eye on the current item instead of flickering row by row.

## Usage

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem>
      Rename <DropdownMenuShortcut>R</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem>Duplicate</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// <DropdownMenuContent effect="materialize"> grows the menu out of the trigger; effect="spring" slides one highlight between items.
```

Exports: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`, `DropdownMenuLabel`, `DropdownMenuShortcut`, `DropdownMenuGroup`
