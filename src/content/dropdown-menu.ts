import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "dropdown-menu",
  title: "Dropdown Menu",
  category: "core",
  description:
    "Compact menu of actions that opens from a button and closes on choice, with arrow-key navigation and a destructive variant.",
  why: {
    principle: "Hick's law",
    explanation:
      "Decision time grows with the number of options in view. Folding secondary actions into a menu leaves the one primary button on screen, and when the menu opens each item is a single labelled row the arrow keys can walk. Keep it to seven items or fewer; past that, group with a label and separator or move actions elsewhere.",
    avoid:
      "Do not hide the primary action in a menu, and do not use it to navigate between pages or to pick a value; Tabs and Select exist for those.",
  },
  usage: `import {
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
</DropdownMenu>`,
  exports: [
    "DropdownMenu",
    "DropdownMenuTrigger",
    "DropdownMenuContent",
    "DropdownMenuItem",
    "DropdownMenuSeparator",
    "DropdownMenuLabel",
    "DropdownMenuShortcut",
    "DropdownMenuGroup",
  ],
}
