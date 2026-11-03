# Toolbar

A row of tools that is one tab stop: arrow keys rove inside it, with groups, separators, links and toggles, and it wraps or scrolls instead of breaking the layout.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/toolbar.json
```

## Why it looks like this

**Fitts's law.** Frequent actions belong right next to the work, one press away and always visible, rather than behind a menu. Grouping keeps twenty tools scannable as a few clusters, and because the whole row is one tab stop, keyboard users can pass it without pressing Tab twenty times.

**Don't.** Do not fill it with rarely used actions; those belong in a menu. Icon-only tools need an accessible name and usually a tooltip, since an icon is rarely as clear as its author believes.

## Designs

Pass one as the `variant` prop.

- `plain` (Law of common region): Docked above an editor or a table, as part of the page.
- `floating` (Figure and ground): Over a canvas or beside a selection: the raised surface says it sits above the work and acts on it.
- `pill` (Law of similarity): With a handful of view or format switches on a lighter surface, where a rounded track matches the controls around it.
- `vertical` (Proximity to the work): Along the side of a drawing or design surface, which costs width instead of the height wide screens lack.

## Effects

Pass one as the `effect` prop.

- `spring` (Continuity): With a single-choice group such as the active tool: the highlight travels between items so the change is seen as a move. Multiple groups stay as they are, because nothing moves there.

## Usage

```tsx
import { Toolbar, ToolbarButton, ToolbarSeparator, ToolbarToggleGroup, ToolbarToggleItem } from "@/components/ui/toolbar"

<Toolbar aria-label="Formatting" variant="floating" effect="spring" overflow="scroll">
  <ToolbarButton aria-label="Undo"><Undo2 /></ToolbarButton>
  <ToolbarSeparator />
  <ToolbarToggleGroup type="single" aria-label="Alignment" defaultValue="left">
    <ToolbarToggleItem value="left" aria-label="Left"><AlignLeft /></ToolbarToggleItem>
    <ToolbarToggleItem value="center" aria-label="Centre"><AlignCenter /></ToolbarToggleItem>
  </ToolbarToggleGroup>
</Toolbar>
```

Exports: `Toolbar`, `ToolbarGroup`, `ToolbarSeparator`, `ToolbarButton`, `ToolbarLink`, `ToolbarToggleGroup`, `ToolbarToggleItem`
