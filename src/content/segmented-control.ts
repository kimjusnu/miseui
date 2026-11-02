import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "segmented-control",
  title: "Segmented Control",
  category: "forms",
  description: "A short set of mutually exclusive views, always one on, as a thumb in a track, chips, an underline or square icons.",
  why: {
    principle: "Recognition over recall",
    explanation:
      "All the options sit on screen and exactly one is on, so nobody has to open anything or remember what else there was. Because it behaves like a radio group, one press changes the view at once and the arrow keys move through the options.",
    avoid:
      "Do not use it past about five options or for long labels; use a select. Do not use it to navigate between pages or panels of different content, which is what tabs are for. If nothing being selected is a valid state, use a toggle group.",
  },
  designs: [
    {
      name: "plain",
      principle: "Figure and ground",
      use: "The default for switching a view in a toolbar or a chart header, where the raised thumb stands out from the sunken track.",
    },
    {
      name: "pill",
      principle: "Law of similarity",
      use: "Above a list or on a marketing page, where a strong solid chip makes the chosen option the first thing seen.",
    },
    {
      name: "underline",
      principle: "Economy of attention",
      use: "Inside a dense panel or a card header, where a line carries the state without adding another surface.",
    },
    {
      name: "icon",
      principle: "Picture superiority",
      use: "For well-known choices like list and grid or text alignment, where glyphs save width. Give each one an aria-label.",
    },
  ],
  effects: [
    {
      name: "spring",
      principle: "Spatial continuity",
      use: "When switching often: one thumb slides over and shows where the choice went. It lives inside the chosen option, so it stays aligned when the control resizes.",
    },
  ],
  usage: `import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control"

<SegmentedControl aria-label="Range" defaultValue="week" effect="spring">
  <SegmentedControlItem value="day">Day</SegmentedControlItem>
  <SegmentedControlItem value="week">Week</SegmentedControlItem>
  <SegmentedControlItem value="month">Month</SegmentedControlItem>
</SegmentedControl>`,
  exports: ["SegmentedControl", "SegmentedControlItem"],
}
