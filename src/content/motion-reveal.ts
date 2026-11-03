import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "motion-reveal",
  title: "Motion Reveal",
  category: "display",
  description: "One wrapper that lets its content arrive when it comes into view, once, as a block or child by child.",
  why: {
    principle: "Staging",
    explanation:
      "A small arrival tells the eye where new content landed while scrolling, and playing only once means reading something again never costs a wait. People who turned motion off get the content at once, with no observer at work.",
    avoid:
      "Do not wrap everything: when each block on a page moves, none of them says anything. Keep it off interface people work in every day, and off anything above the fold that should already be there.",
  },
  designs: [
    {
      name: "rise",
      principle: "Direction of reading",
      use: "Sections of a landing page, where moving up matches the way the page itself is moving.",
    },
    {
      name: "fade",
      principle: "Economy of motion",
      use: "Inside a product or close to text being read, where any movement would pull too hard.",
    },
    {
      name: "clip",
      principle: "Occlusion",
      use: "Images and panels: being uncovered reads as already there, instead of something sliding in.",
    },
  ],
  effects: [
    {
      name: "stagger",
      principle: "Common fate",
      use: "A short list or a row of cards, where arriving one after another shows they are separate items.",
    },
  ],
  usage: `import { MotionReveal } from "@/components/ui/motion-reveal"

<MotionReveal as="section">
  <h2>Results</h2>
</MotionReveal>

<MotionReveal as="ul" effect="stagger" variant="fade">
  <span>First row</span>
  <span>Second row</span>
</MotionReveal>`,
  exports: ["MotionReveal", "staggerDelay"],
}
