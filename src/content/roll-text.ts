import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "roll-text",
  title: "Roll Text",
  category: "text",
  description: "A label that rolls to a fresh copy of itself on hover or when its value changes, while assistive tech hears it once.",
  why: {
    principle: "Feedback through continuity",
    explanation:
      "A link that answers the pointer feels alive, and the answer costs no extra colour or layout because the same word simply moves. The word never changes size, so nothing around it shifts while it rolls.",
    avoid:
      "Do not use it on running text or on more than a few labels at once; a page where everything rolls loses the signal. Do not hide information in the second copy, since touch screens never hover.",
  },
  designs: [
    {
      name: "word",
      principle: "Economy of motion",
      use: "Navigation and footer links, where a quick single roll is enough and a wave would be fussy.",
    },
    {
      name: "letters",
      principle: "Common fate",
      use: "One short call to action or display link that is allowed to be the moment on the page.",
    },
    {
      name: "flip",
      principle: "Spatial metaphor",
      use: "A bold label on a button or a tile, where turning over suggests there is a back to it.",
    },
  ],
  effects: [
    {
      name: "change",
      principle: "Change blindness",
      use: "A label that reports state, such as Save to Saved: the movement makes sure the new word gets noticed.",
    },
  ],
  usage: `import { RollText } from "@/components/ui/roll-text"

<a href="/pricing"><RollText text="Pricing" /></a>

// A whole row drives the label
<a href="/docs" className="group"><RollText text="Read the docs" variant="letters" trigger="parent" /></a>

// Rolls when the value changes
<RollText text={saved ? "Saved" : "Save"} effect="change" />`,
  exports: ["RollText", "letterDelay"],
}
