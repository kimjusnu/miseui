import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "scramble-text",
  title: "Scramble Text",
  category: "text",
  description: "Noise that settles into the real sentence, with every letter holding its final width so nothing on the page moves.",
  why: {
    principle: "Von Restorff effect",
    explanation:
      "The one thing changing on a still page is the thing people look at, so a short settle points the eye at a line without enlarging or colouring it. Each letter sits in a cell sized by its final glyph, which keeps the neighbours and the line breaks where they will end up, and screen readers get the sentence once instead of the noise.",
    avoid:
      "Use it on one short line per view, such as a label or a headline. Do not scramble body text, prices, or anything people must read at once, and do not use it for text that is actually loading: a scramble promises nothing about progress.",
  },
  designs: [
    {
      name: "letters",
      principle: "Similarity",
      use: "A headline in the page's own face: same-case noise keeps the shape of the line, so it reads as the text arriving and not as a different element.",
    },
    {
      name: "mono",
      principle: "Signal and noise",
      use: "A technical label or status line: symbols in a monospace face, muted until each letter resolves in full contrast, so the finished part is the part that stands out.",
    },
    {
      name: "center",
      principle: "Symmetry",
      use: "A centred headline: it settles from where the eye already is and spreads to both edges.",
    },
    {
      name: "ticker",
      principle: "Continuity",
      use: "Codes, times and departures: each letter walks the alphabet in order like a split-flap board, so the change has a direction instead of being random.",
    },
  ],
  effects: [
    {
      name: "hover",
      principle: "Feedback",
      use: "A text link that answers when pointed at or focused, resting as plain text the rest of the time. It listens on the link around it, so keyboard users get the same answer.",
    },
  ],
  usage: `import { ScrambleText } from "@/components/ui/scramble-text"

<ScrambleText as="h1" text="Ship the quiet version" trigger="mount" />

<ScrambleText text="Deploy finished in 42s" variant="mono" />

<ScrambleText text="Gate B12 boards at 19:40" variant="ticker" />

<a href="/changelog">
  <ScrambleText text="Read the changelog" effect="hover" />
</a>`,
  exports: ["ScrambleText"],
}
