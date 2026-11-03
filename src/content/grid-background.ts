import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "grid-background",
  title: "Grid Background",
  category: "backgrounds",
  description: "Hairlines behind your content: an even grid, a fading one, a floor receding to a horizon or a few filled cells, with an optional brightening around the pointer.",
  why: {
    principle: "Figure and ground",
    explanation:
      "A faint structure gives an empty panel a surface without competing for attention. The lines stay at the border colour, so the eye reads the sentence on top as the figure and the grid as the ground it stands on.",
    avoid:
      "Do not put a grid behind long paragraphs or dense tables, where hairlines cross the letters. If you notice the grid before the sentence, use a larger cell or the fade variant. Do not stack it with another background.",
  },
  designs: [
    { name: "lines", principle: "Uniform connectedness", use: "Behind a tool or a developer page, where an even grid says precision and needs no focal point of its own." },
    { name: "fade", principle: "Focal point", use: "Behind a centred heading, where the lines dissolve toward the edges and pull the eye to the middle." },
    { name: "perspective", principle: "Depth cues", use: "In a landing hero with room above the floor, where a horizon adds depth without an image." },
    { name: "blocks", principle: "Isolation effect", use: "In a card or a section header with text on the left: a few filled cells gather in the top right and leave the words alone." },
  ],
  effects: [
    {
      name: "pointer",
      principle: "Direct manipulation",
      use: "On a hero people move across, where lines brightening under the pointer show that the surface is live. It stays off on touch, and nothing may depend on it.",
    },
  ],
  usage: `import { GridBackground } from "@/components/ui/grid-background"

<GridBackground variant="fade" className="rounded-xl border py-24">
  <h1>Plan the release on one board</h1>
</GridBackground>

// Cell size comes from a custom property. seed picks the cells of blocks.
<GridBackground variant="blocks" seed={21} effect="pointer" className="[--mise-grid-cell:48px]">…</GridBackground>`,
  exports: ["GridBackground", "pickGridBlocks", "seededUnit"],
}
