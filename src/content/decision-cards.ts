import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "decision-cards",
  title: "Decision Cards",
  category: "display",
  description: "A record of decisions: the question, what was chosen, what lost and why.",
  why: {
    principle: "Credibility through trade-offs",
    explanation:
      "Showing what was turned down proves a choice was a choice. Readers trust a reason more when they can see the option it beat, and the fixed shape makes a list of decisions quick to compare.",
    avoid:
      "Do not use it for options still open; that is a comparison table. If nothing was seriously considered instead, a plain sentence is more honest than an invented alternative.",
  },
  designs: [
    {
      name: "split",
      principle: "Side by side comparison",
      use: "A case study with a few big decisions, where each one deserves a card and the winner should be seen first.",
    },
    {
      name: "diff",
      principle: "Familiar metaphor",
      use: "A technical write-up, where struck out and written in reads like a code review and the chosen line carries the page.",
    },
    {
      name: "ledger",
      principle: "Information density",
      use: "A long log of decisions in a design doc or a wiki, one short record per row.",
    },
  ],
  effects: [
    {
      name: "disclose",
      principle: "Progressive disclosure",
      use: "More than about five decisions: readers scan the outcomes and open only the reasons they want to argue with.",
    },
  ],
  usage: `import { DecisionCards } from "@/components/ui/decision-cards"

<DecisionCards
  variant="diff"
  items={[
    {
      title: "Where should search run?",
      chosen: "In the database",
      rejected: ["A hosted search service", "A separate index"],
      reason: "Eight thousand rows did not justify one more system to keep in step.",
    },
  ]}
/>`,
  exports: ["DecisionCards"],
}
