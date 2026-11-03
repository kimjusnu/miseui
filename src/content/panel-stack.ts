import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "panel-stack",
  title: "Panel Stack",
  category: "display",
  description: "A story told one panel at a time with a page count and a progress line, in the page or over the whole screen.",
  why: {
    principle: "Serial position effect",
    explanation:
      "One idea per screen holds attention better than a long scroll, and an order only exists when the reader can see it. The count and the line say how much is left, which is the question that decides whether someone keeps going.",
    avoid:
      "For a row of equal things to browse in any order, use a carousel. Do not hide anything essential past the first panel; many people will not turn the page.",
  },
  designs: [
    {
      name: "deck",
      principle: "Single focus",
      use: "A short sequence inside a page, such as a process in three steps, with one panel filling the column.",
    },
    {
      name: "peek",
      principle: "Affordance",
      use: "Phones and narrow columns: the edge of the next panel says there is more, with no explanation needed.",
    },
    {
      name: "overlay",
      principle: "Change of context",
      use: "The details of one case study from a list: the whole screen slides over, and going back returns you to where you were.",
    },
  ],
  effects: [
    {
      name: "wheel",
      principle: "Natural mapping",
      use: "In the overlay, where the wheel otherwise has nothing to do: one gesture turns one panel. In a page, it would stop people scrolling past.",
    },
  ],
  usage: `import { PanelStack } from "@/components/ui/panel-stack"

const panels = [
  { title: "The problem", kicker: "Start here", content: <p>Half of teams never invited anyone.</p> },
  { title: "The result", content: <p>Two out of three now do.</p> },
]

<PanelStack panels={panels} label="Case study" variant="peek" />

<PanelStack panels={panels} label="Case study" variant="overlay" effect="wheel" trigger={<Button>Read the case study</Button>} />`,
  exports: ["PanelStack", "wheelStep", "nearestPanel"],
}
