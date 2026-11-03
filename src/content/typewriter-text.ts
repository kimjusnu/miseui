import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "typewriter-text",
  title: "Typewriter Text",
  category: "text",
  description: "A staged line that types itself with a human rhythm, the whole text laid out from the start so lines never reflow.",
  why: {
    principle: "Labor illusion",
    explanation:
      "Seeing something being written feels like work done for you, and people value a result more when they watch it being made. The rhythm comes from a seeded cadence that stops at punctuation, the way a hand does, and every letter's place is already laid out, so the page stays still while it types.",
    avoid:
      "This is staged, so do not use it for text that is really arriving from a model or a server: use streaming-text for that. Never make people wait on it to act, and keep it to one line per view. The field variant only looks like an input; if people type here, use a real input.",
  },
  designs: [
    {
      name: "line",
      principle: "Economy of motion",
      use: "A headline or a sentence in the page's own face: the thin caret is the only thing that adds to the text.",
    },
    {
      name: "block",
      principle: "Mental model",
      use: "An install command or a terminal step: the monospace face, the prompt and the block caret all say that this is a command.",
    },
    {
      name: "underscore",
      principle: "Similarity",
      use: "A retro or editorial headline, where a low bar sits with the type instead of cutting through it.",
    },
    {
      name: "field",
      principle: "Affordance",
      use: "A hero that shows what can be asked: a live placeholder in an input-looking box teaches by example.",
    },
  ],
  effects: [
    {
      name: "loop",
      principle: "User control",
      use: "Several examples of what a product can do. It types, waits, deletes and moves on, and holds still off screen, in a hidden tab, and on hover or focus, because anything moving for over five seconds must be stoppable.",
    },
  ],
  usage: `import { TypewriterText } from "@/components/ui/typewriter-text"

<TypewriterText as="h1" text="Your notes, written for you." />

<TypewriterText text="pnpm add motion" variant="block" />

<TypewriterText
  variant="field"
  effect="loop"
  phrases={["Summarise last week's invoices", "Find the contract with Hana Park"]}
/>`,
  exports: ["TypewriterText"],
}
