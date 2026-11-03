import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "rotating-text",
  title: "Rotating Text",
  category: "text",
  description: "One word in a sentence that takes turns with others, with a slot that springs to each new width and stops whenever someone is reading.",
  why: {
    principle: "Selective attention",
    explanation:
      "One moving word in a still sentence draws the eye to the only part that varies, so a single line can say who a product is for without a list. It holds still on hover, on focus, off screen and in a hidden tab, and screen readers get every word once.",
    avoid:
      "Do not put anything people need to act on in the rotating word: most readers see only one of them. Use it once per view, with words of a similar length, and offer a way to pause it if it stays on screen for long.",
  },
  designs: [
    {
      name: "slide",
      principle: "Common fate",
      use: "A hero line: the word leaves upward and the next rises behind a mask, which reads as a list going by.",
    },
    {
      name: "blur",
      principle: "Depth of field",
      use: "A quieter sentence, or one over an image, where a hard edge would be too much and the change should almost go unnoticed.",
    },
    {
      name: "flip",
      principle: "Physical metaphor",
      use: "Short, solid words such as a platform or a plan name, which turn over like a sign with a real sense of depth.",
    },
    {
      name: "pill",
      principle: "Figure and ground",
      use: "When the word is a choice or a category, so it sits on a soft chip whose width springs with each word.",
    },
  ],
  effects: [
    {
      name: "letters",
      principle: "Follow-through",
      use: "A short display line with one word in it, where a small wave along the letters is the one flourish on the page.",
    },
  ],
  usage: `import { RotatingText } from "@/components/ui/rotating-text"

<RotatingText as="h1" before="Invoices for " words={["freelancers", "studios", "small teams"]} after="." />

<RotatingText before="Open on " words={["phones", "tablets", "desktops"]} variant="flip" interval={3000} />

<RotatingText before="Book a " words={["demo", "call", "walkthrough"]} variant="pill" paused={paused} />

<RotatingText words={["개발자", "디자이너"]} after="를 위한 도구" effect="letters" />`,
  exports: ["RotatingText", "clampInterval", "nextWordIndex", "spokenSentence"],
}
