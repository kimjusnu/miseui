# Context Menu

The menu that opens where you press: right-click, long press or the Menu key, with sub menus, check and radio items and shortcuts.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/context-menu.json
```

## Why it looks like this

**Fitts's law.** The menu appears under the pointer, so the commands are the shortest possible distance from the thing they act on. Actions stay out of sight until someone asks, which keeps a dense surface such as a file list or a canvas calm.

**Don't.** Nobody can see a context menu until they try one, so never make it the only way to reach an action. Every item here should also exist in a visible button, a toolbar or a keyboard shortcut.

## Designs

Pass one as the `variant` prop.

- `plain` (Jakob's law): The default: rows that look like the menu people already know from their operating system.
- `compact` (Information density): In tools with long menus and precise pointers, such as editors and data grids. Rows still grow to 40 px on touch.
- `grouped` (Law of common region): When a menu holds different kinds of action, and a labelled section with its own divider saves reading every row.
- `icon` (Picture superiority effect): When people return often and find items by shape, with a quick row on top for the three commands used most.

## Effects

Pass one as the `effect` prop.

- `materialize` (Spatial continuity): On larger menus, where the panel growing out of the pressed point makes clear what it belongs to.

## Usage

```tsx
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
} from "@/components/ui/context-menu"

<ContextMenu variant="grouped" effect="materialize">
  <ContextMenuTrigger>Right-click this row</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>
      Rename <ContextMenuShortcut>F2</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem tone="destructive">Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

Exports: `ContextMenu`, `ContextMenuTrigger`, `ContextMenuContent`, `ContextMenuItem`, `ContextMenuCheckboxItem`, `ContextMenuRadioGroup`, `ContextMenuRadioItem`, `ContextMenuLabel`, `ContextMenuGroup`, `ContextMenuSeparator`, `ContextMenuShortcut`, `ContextMenuQuickRow`, `ContextMenuQuickItem`, `ContextMenuSub`, `ContextMenuSubTrigger`, `ContextMenuSubContent`
