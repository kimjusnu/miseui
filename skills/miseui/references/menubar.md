# Menubar

The row of menus desktop tools are built on, with sub menus, check and radio items, shortcuts and full arrow key movement across the bar.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/menubar.json
```

## Why it looks like this

**Jakob's law.** People have spent years with File, Edit and View across the top of their tools, so they already know where to look and how it behaves. A menubar lets a tool with many commands keep them all findable, and the shortcut beside each item quietly teaches the faster way.

**Don't.** Do not use it for site navigation or for a product with a handful of actions; a navigation menu or a toolbar fits those. Menus are hidden until opened, so never put the main action of a screen only in here.

## Designs

Pass one as the `variant` prop.

- `plain` (Law of common region): As a contained tool strip inside a page or a panel, where the border says these menus belong together.
- `ghost` (Figure and ground): Above a canvas or an editor, where the work should keep all the attention until a menu is needed.
- `pill` (Law of similarity): On a lighter product surface, where a rounded track matches other rounded controls around it.
- `app` (Visual hierarchy): At the top of a document editor: the name of the document above, the menus that act on it below.

## Effects

Pass one as the `effect` prop.

- `materialize` (Spatial continuity): When the menus are few and opened often enough to feel: each one comes into focus out of its own trigger.

## Usage

```tsx
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarShortcut } from "@/components/ui/menubar"

<Menubar variant="app" title="Q3 forecast" aria-label="Document">
  <MenubarMenu>
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Rename <MenubarShortcut>F2</MenubarShortcut></MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>
```

Exports: `Menubar`, `MenubarMenu`, `MenubarTrigger`, `MenubarContent`, `MenubarItem`, `MenubarCheckboxItem`, `MenubarRadioGroup`, `MenubarRadioItem`, `MenubarLabel`, `MenubarSeparator`, `MenubarShortcut`, `MenubarGroup`, `MenubarSub`, `MenubarSubTrigger`, `MenubarSubContent`
