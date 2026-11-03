import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "section-index",
  title: "Section Index",
  category: "navigation",
  description: "A numbered map of the chapters in a long read that fills as you go, as a rail, a sticky strip or a one-line counter.",
  why: {
    principle: "Goal gradient effect",
    explanation:
      "People keep going when they can see how far they have come, so finished chapters stay filled instead of a marker just moving. It tracks whole sections, not headings, which is what lets it say how much of the current one is left.",
    avoid:
      "For documentation with nested headings read from the page, use a table of contents: this one is a flat list of chapters you name yourself. Three chapters or fewer do not need an index at all.",
  },
  designs: [
    {
      name: "rail",
      principle: "Goal gradient effect",
      use: "A sticky side column beside a case study on a wide screen.",
    },
    {
      name: "strip",
      principle: "Economy of space",
      use: "A sticky bar on a phone, where the chapters run sideways and the current one scrolls into view by itself.",
    },
    {
      name: "counter",
      principle: "Progress at a glance",
      use: "When there is room for one line only: where you are out of how many, with steps to the next and previous chapter.",
    },
  ],
  effects: [
    {
      name: "progress",
      principle: "Feedback through continuity",
      use: "Long chapters, where the mark would otherwise sit unchanged for minutes and look stuck.",
    },
  ],
  usage: `import { SectionIndex } from "@/components/ui/section-index"

<SectionIndex
  effect="progress"
  items={[
    { id: "problem", title: "The problem" },
    { id: "approach", title: "The approach" },
    { id: "result", title: "The result" },
  ]}
/>

<section id="problem">...</section>
<section id="approach">...</section>
<section id="result">...</section>`,
  exports: ["SectionIndex"],
}
