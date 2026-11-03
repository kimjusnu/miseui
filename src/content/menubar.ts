import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "menubar",
  title: "Menubar",
  category: "navigation",
  description: "The row of menus desktop tools are built on, with sub menus, check and radio items, shortcuts and full arrow key movement across the bar.",
  why: {
    principle: "Jakob's law",
    explanation:
      "People have spent years with File, Edit and View across the top of their tools, so they already know where to look and how it behaves. A menubar lets a tool with many commands keep them all findable, and the shortcut beside each item quietly teaches the faster way.",
    avoid:
      "Do not use it for site navigation or for a product with a handful of actions; a navigation menu or a toolbar fits those. Menus are hidden until opened, so never put the main action of a screen only in here.",
  },
  designs: [
    {
      name: "plain",
      principle: "Law of common region",
      use: "As a contained tool strip inside a page or a panel, where the border says these menus belong together.",
    },
    {
      name: "ghost",
      principle: "Figure and ground",
      use: "Above a canvas or an editor, where the work should keep all the attention until a menu is needed.",
    },
    {
      name: "pill",
      principle: "Law of similarity",
      use: "On a lighter product surface, where a rounded track matches other rounded controls around it.",
    },
    {
      name: "app",
      principle: "Visual hierarchy",
      use: "At the top of a document editor: the name of the document above, the menus that act on it below.",
    },
  ],
  effects: [
    {
      name: "materialize",
      principle: "Spatial continuity",
      use: "When the menus are few and opened often enough to feel: each one comes into focus out of its own trigger.",
    },
  ],
  usage: `import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarShortcut } from "@/components/ui/menubar"

<Menubar variant="app" title="Q3 forecast" aria-label="Document">
  <MenubarMenu>
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Rename <MenubarShortcut>F2</MenubarShortcut></MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
  exports: [
    "Menubar",
    "MenubarMenu",
    "MenubarTrigger",
    "MenubarContent",
    "MenubarItem",
    "MenubarCheckboxItem",
    "MenubarRadioGroup",
    "MenubarRadioItem",
    "MenubarLabel",
    "MenubarSeparator",
    "MenubarShortcut",
    "MenubarGroup",
    "MenubarSub",
    "MenubarSubTrigger",
    "MenubarSubContent",
  ],
}
