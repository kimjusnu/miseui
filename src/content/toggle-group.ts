import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "toggle-group",
  title: "Toggle Group",
  category: "forms",
  description: "A row of buttons that stay pressed, one at a time or several at once: quiet fill, joined outline, wrapping chips or square icons.",
  why: {
    principle: "Law of common region",
    explanation:
      "Options that act on the same thing belong together, and placing them in one group says so before anyone reads them. Pressed state stays visible, so the current settings are on screen at all times. Arrow keys move inside the group, which means one Tab stop in place of one for every button.",
    avoid:
      "Do not use it to submit anything or to run a one-off command; a pressed look promises a state that lasts. Single mode allows nothing selected, so when one option must always be on, use a segmented control.",
  },
  designs: [
    {
      name: "plain",
      principle: "Economy of attention",
      use: "In an editor toolbar, where several groups sit side by side and borders on each would become a wall of lines.",
    },
    {
      name: "outline",
      principle: "Law of connectedness",
      use: "On its own in a form, where joined edges make it read as one control with one job.",
    },
    {
      name: "pill",
      principle: "Scannability",
      use: "For filters with word labels, which wrap to a second line on a phone and stay easy to scan.",
    },
    {
      name: "icon",
      principle: "Picture superiority",
      use: "For familiar formatting glyphs where width is short and the accent has to show what is on. Give each one an aria-label.",
    },
  ],
  effects: [
    {
      name: "spring",
      principle: "Spatial continuity",
      use: "Where the state changes a lot: in single mode the highlight slides across, and in multiple mode each highlight grows in place, since there is nothing to travel from.",
    },
  ],
  usage: `import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

<ToggleGroup type="multiple" variant="icon" aria-label="Formatting" defaultValue={["bold"]}>
  <ToggleGroupItem value="bold" aria-label="Bold"><Bold /></ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Italic"><Italic /></ToggleGroupItem>
</ToggleGroup>

<ToggleGroup variant="outline" effect="spring" defaultValue="left">…</ToggleGroup>`,
  exports: ["ToggleGroup", "ToggleGroupItem"],
}
