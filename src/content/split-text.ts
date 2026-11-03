import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "split-text",
  title: "Split Text",
  category: "text",
  description: "A headline that arrives letter by letter or word by word, with the real sentence kept for assistive tech.",
  why: {
    principle: "Staging",
    explanation:
      "A single short arrival tells the eye where to start on a new screen, and the left-to-right wave moves in the direction people read. Screen readers skip the letters and get the whole sentence, so the effect costs them nothing.",
    avoid:
      "Use it once per view, on one headline. Do not split body text, buttons or anything people read twice, and do not hold important content behind the delay.",
  },
  designs: [
    {
      name: "rise",
      principle: "Occlusion",
      use: "A display headline: letters coming out from behind a line feel set in place, like type on a press.",
    },
    {
      name: "fade",
      principle: "Economy of motion",
      use: "A heading in a product or a longer sentence, split by word, where movement would be too much.",
    },
    {
      name: "blur",
      principle: "Depth of field",
      use: "A hero over an image or a large gradient, where coming into focus matches the depth already there.",
    },
  ],
  effects: [
    {
      name: "center",
      principle: "Symmetry",
      use: "A centred headline: the wave starts from where the eye already is and spreads to both edges.",
    },
  ],
  usage: `import { SplitText } from "@/components/ui/split-text"

<SplitText as="h1" text="Ship the quiet version" trigger="mount" />

<SplitText as="h2" text="Every sentence earns its place" variant="fade" by="words" />

<SplitText as="h1" text="Fewer screens" variant="blur" effect="center" delay={0.2} />`,
  exports: ["SplitText", "SPLIT_PRESETS", "splitText", "pieceDelay"],
}
