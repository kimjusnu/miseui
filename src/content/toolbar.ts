import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "toolbar",
  title: "Toolbar",
  category: "forms",
  description: "A row of tools that is one tab stop: arrow keys rove inside it, with groups, separators, links and toggles, and it wraps or scrolls instead of breaking the layout.",
  why: {
    principle: "Fitts's law",
    explanation:
      "Frequent actions belong right next to the work, one press away and always visible, rather than behind a menu. Grouping keeps twenty tools scannable as a few clusters, and because the whole row is one tab stop, keyboard users can pass it without pressing Tab twenty times.",
    avoid:
      "Do not fill it with rarely used actions; those belong in a menu. Icon-only tools need an accessible name and usually a tooltip, since an icon is rarely as clear as its author believes.",
  },
  designs: [
    {
      name: "plain",
      principle: "Law of common region",
      use: "Docked above an editor or a table, as part of the page.",
    },
    {
      name: "floating",
      principle: "Figure and ground",
      use: "Over a canvas or beside a selection: the raised surface says it sits above the work and acts on it.",
    },
    {
      name: "pill",
      principle: "Law of similarity",
      use: "With a handful of view or format switches on a lighter surface, where a rounded track matches the controls around it.",
    },
    {
      name: "vertical",
      principle: "Proximity to the work",
      use: "Along the side of a drawing or design surface, which costs width instead of the height wide screens lack.",
    },
  ],
  effects: [
    {
      name: "spring",
      principle: "Continuity",
      use: "With a single-choice group such as the active tool: the highlight travels between items so the change is seen as a move. Multiple groups stay as they are, because nothing moves there.",
    },
  ],
  usage: `import { Toolbar, ToolbarButton, ToolbarSeparator, ToolbarToggleGroup, ToolbarToggleItem } from "@/components/ui/toolbar"

<Toolbar aria-label="Formatting" variant="floating" effect="spring" overflow="scroll">
  <ToolbarButton aria-label="Undo"><Undo2 /></ToolbarButton>
  <ToolbarSeparator />
  <ToolbarToggleGroup type="single" aria-label="Alignment" defaultValue="left">
    <ToolbarToggleItem value="left" aria-label="Left"><AlignLeft /></ToolbarToggleItem>
    <ToolbarToggleItem value="center" aria-label="Centre"><AlignCenter /></ToolbarToggleItem>
  </ToolbarToggleGroup>
</Toolbar>`,
  exports: ["Toolbar", "ToolbarGroup", "ToolbarSeparator", "ToolbarButton", "ToolbarLink", "ToolbarToggleGroup", "ToolbarToggleItem"],
}
