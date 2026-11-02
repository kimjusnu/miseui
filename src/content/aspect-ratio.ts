import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "aspect-ratio",
  title: "Aspect Ratio",
  category: "display",
  description: "Holds the space for media before it arrives, so the page does not jump, with a mat, an overlaid caption or an empty slot.",
  why: {
    principle: "Layout stability",
    explanation:
      "An image with no reserved height pushes everything below it down when it loads, often just as someone reaches for a link. Reserving the box from the ratio keeps the page where the reader left it, and it also keeps a grid of mixed photos in even rows.",
    avoid:
      "Do not force a ratio on media whose full frame matters, such as a chart or a screenshot, because object-cover crops the edges. Use the image at its own ratio there.",
  },
  designs: [
    {
      name: "plain",
      principle: "Figure and ground",
      use: "In a gallery or a card, where the photo is the only thing to look at and any frame would compete with it.",
    },
    {
      name: "framed",
      principle: "Law of common region",
      use: "When a caption has to stay with its picture in a long article, so a mat holds the two together as one object.",
    },
    {
      name: "overlay",
      principle: "Visual hierarchy",
      use: "On a tile that links somewhere, where the title reads as part of the picture and there is no room below it.",
    },
    {
      name: "placeholder",
      principle: "Signifiers",
      use: "In an editor or a template, where the dashed slot says something belongs here and at what shape.",
    },
  ],
  effects: [
    {
      name: "reveal",
      principle: "Perceived performance",
      use: "When photos load over a slow connection: nothing paints from the top down, the image comes into focus once it is whole.",
    },
  ],
  usage: `import { AspectRatio } from "@/components/ui/aspect-ratio"

<AspectRatio ratio={16 / 9} effect="reveal">
  <img src="/harbour.jpg" alt="Boats in the harbour at dusk" />
</AspectRatio>

<AspectRatio variant="overlay" ratio={4 / 3} caption="Harbour at dusk">…</AspectRatio>
<AspectRatio variant="placeholder" ratio={1} />`,
  exports: ["AspectRatio", "ratioLabel"],
}
