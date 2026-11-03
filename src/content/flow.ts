import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "flow",
  title: "Flow",
  category: "display",
  description: "A process drawn from data, with arrows that can carry words, and no diagram library to load.",
  why: {
    principle: "Law of continuity",
    explanation:
      "The eye follows a line, so arrows between steps turn a list of facts into one story with a direction. Words on an arrow carry the condition, such as if approved, which is what people usually need to know and what a plain numbered list leaves out.",
    avoid:
      "Do not use it for steps someone is working through right now, which is Steps with its progress. It draws one line only, so a process with real branches and loops belongs in Metro Map or a proper diagram.",
  },
  designs: [
    {
      name: "walkthrough",
      principle: "Progressive disclosure",
      use: "Inside an article or a case study where each step needs a paragraph: one at a time, in a frame that does not change height.",
    },
    {
      name: "chain",
      principle: "Law of continuity",
      use: "For a short process seen at a glance, with boxes and arrows that stack in a narrow column and run in one row when there is room.",
    },
    {
      name: "rail",
      principle: "Reading order",
      use: "For a longer process or a phone layout: a numbered column with every detail open and room for words on each link.",
    },
    {
      name: "inline",
      principle: "Signal to noise",
      use: "Inside a sentence, a table cell or a card footer, where the order of a few words is all that needs saying.",
    },
  ],
  effects: [
    {
      name: "spring",
      principle: "Spatial consistency",
      use: "On a walkthrough: the marker slides between steps, so the move reads as forward or back and not as a new page. Other variants ignore it.",
    },
    {
      name: "sequence",
      principle: "Temporal order",
      use: "On chain, rail and inline: steps come in one after another the first time they are seen, so the order is felt before it is read.",
    },
  ],
  usage: `import { Flow } from "@/components/ui/flow"

const steps = [
  { title: "Draft", tag: "Author", detail: "Written in the shared doc.", arrow: "when ready" },
  { title: "Review", detail: "A teammate reads it within a day.", arrow: "if approved" },
  { title: "Publish", detail: "It goes live on Tuesday." },
]

<Flow label="Publishing" steps={steps} effect="spring" />

<Flow label="Publishing" steps={steps} variant="chain" effect="sequence" />`,
  exports: ["Flow"],
}
