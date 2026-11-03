import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "context-menu",
  title: "Context Menu",
  category: "overlays",
  description: "The menu that opens where you press: right-click, long press or the Menu key, with sub menus, check and radio items and shortcuts.",
  why: {
    principle: "Fitts's law",
    explanation:
      "The menu appears under the pointer, so the commands are the shortest possible distance from the thing they act on. Actions stay out of sight until someone asks, which keeps a dense surface such as a file list or a canvas calm.",
    avoid:
      "Nobody can see a context menu until they try one, so never make it the only way to reach an action. Every item here should also exist in a visible button, a toolbar or a keyboard shortcut.",
  },
  designs: [
    {
      name: "plain",
      principle: "Jakob's law",
      use: "The default: rows that look like the menu people already know from their operating system.",
    },
    {
      name: "compact",
      principle: "Information density",
      use: "In tools with long menus and precise pointers, such as editors and data grids. Rows still grow to 40 px on touch.",
    },
    {
      name: "grouped",
      principle: "Law of common region",
      use: "When a menu holds different kinds of action, and a labelled section with its own divider saves reading every row.",
    },
    {
      name: "icon",
      principle: "Picture superiority effect",
      use: "When people return often and find items by shape, with a quick row on top for the three commands used most.",
    },
  ],
  effects: [
    {
      name: "materialize",
      principle: "Spatial continuity",
      use: "On larger menus, where the panel growing out of the pressed point makes clear what it belongs to.",
    },
  ],
  usage: `import {
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
</ContextMenu>`,
  exports: [
    "ContextMenu",
    "ContextMenuTrigger",
    "ContextMenuContent",
    "ContextMenuItem",
    "ContextMenuCheckboxItem",
    "ContextMenuRadioGroup",
    "ContextMenuRadioItem",
    "ContextMenuLabel",
    "ContextMenuGroup",
    "ContextMenuSeparator",
    "ContextMenuShortcut",
    "ContextMenuQuickRow",
    "ContextMenuQuickItem",
    "ContextMenuSub",
    "ContextMenuSubTrigger",
    "ContextMenuSubContent",
  ],
}
