import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "progress-circular",
  title: "Progress Circular",
  category: "feedback",
  description: "Progress in a small square, with the number in the middle and an honest state for when nobody knows how far along it is.",
  why: {
    principle: "Goal-gradient effect",
    explanation:
      "People put in more effort and wait more patiently as they see the end approaching, and a closing circle shows that remaining distance at a glance. It fits where a bar has no width: table rows, cards and dashboards.",
    avoid:
      "Do not make it the only way to read a precise value: a circle is hard to compare across a row, so use bars when people must rank items. Do not animate fake progress; pass no value when you do not know.",
  },
  designs: [
    {
      name: "ring",
      principle: "Figure and ground",
      use: "The default, for an upload or a task in a card, where the thick stroke holds its own beside the number.",
    },
    {
      name: "thin",
      principle: "Visual hierarchy",
      use: "When the number is the point and the arc only supports it, such as a score or a completion figure.",
    },
    {
      name: "gauge",
      principle: "Mental model",
      use: "For a level with a ceiling, such as disk or quota: an open dial reads as a meter, not as a task that will finish.",
    },
    {
      name: "segmented",
      principle: "Chunking",
      use: "When the work has real steps, such as nine of twelve lessons: each cell is one thing done.",
    },
  ],
  effects: [
    {
      name: "spring",
      principle: "Interruptibility",
      use: "When values arrive often: the arc continues from where it is, so a new number never restarts the motion.",
    },
  ],
  usage: `import { ProgressCircular } from "@/components/ui/progress-circular"

<ProgressCircular value={64} label="Upload" effect="spring" />
<ProgressCircular variant="gauge" size="lg" value={82} label="Disk" />
<ProgressCircular variant="segmented" value={9} max={12} steps={12} label="Lessons">9/12</ProgressCircular>
<ProgressCircular label="Preparing your export" />`,
  exports: ["ProgressCircular"],
}
