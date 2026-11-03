import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "spoiler",
  title: "Spoiler",
  category: "display",
  description: "Hides text or a block until someone presses to see it, so the reader chooses the moment. Screen readers do not get ahead of everyone else.",
  why: {
    principle: "User control and freedom",
    explanation:
      "Some content is only welcome when asked for: the end of a story, the answer to a puzzle, a sensitive image. A deliberate press hands that decision to the reader, and the content stays out of the accessibility tree and the tab order until then, so nobody hears it first by accident.",
    avoid:
      "Do not use it to protect anything secret. The text is still in the page source; passwords and private data belong behind a server check. Do not use `more` for the part most readers came for; show that outright.",
  },
  designs: [
    {
      name: "blur",
      principle: "Curiosity gap",
      use: "When the shape of what is hidden is useful or inviting, such as an answer or a photo that may upset someone.",
    },
    {
      name: "block",
      principle: "Explicit consent",
      use: "When nothing may leak at all and the label should say what is behind it, such as a content warning.",
    },
    {
      name: "inline",
      principle: "Gestalt continuity",
      use: "For a few words inside a sentence, where the bar wraps with the line and the rest stays readable.",
    },
    {
      name: "more",
      principle: "Progressive disclosure",
      use: "For long passages such as a review or a bio, where the first lines are enough for most readers.",
    },
  ],
  effects: [
    {
      name: "blur",
      principle: "Spatial continuity",
      use: "When the reveal itself is a small reward: the content comes into focus in place rather than snapping. Instant under reduced motion.",
    },
  ],
  usage: `import { Spoiler } from "@/components/ui/spoiler"

<Spoiler effect="blur" label="Show the ending">
  <p>The butler did it, and the letter proves it.</p>
</Spoiler>

<p>
  The winner was <Spoiler variant="inline" label="Show the winner">Team Harbor</Spoiler> by two points.
</p>

<Spoiler variant="more" collapsedHeight={96}>{longText}</Spoiler>`,
  exports: ["Spoiler"],
}
