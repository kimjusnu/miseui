import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "hover-preview",
  title: "Hover Preview",
  category: "overlays",
  description: "A preview that follows the pointer over a list of links, so people can look before they commit to a click.",
  why: {
    principle: "Information scent",
    explanation:
      "People decide whether to follow a link from the clues around it. A picture or a line that appears at the point of attention answers what is behind this without a page load, and a plain text list keeps its calm until someone shows interest.",
    avoid:
      "Never put anything in the preview that cannot be reached another way: it does not exist on touch, and it cannot be clicked. For a preview people need to interact with, use Hover Card.",
  },
  designs: [
    {
      name: "card",
      principle: "Information scent",
      use: "For articles or case studies, where a picture, a title and one line help someone choose between rows that look alike.",
    },
    {
      name: "media",
      principle: "Picture superiority effect",
      use: "For visual work such as a portfolio or a photo index: the row stays quiet and the image does all the talking.",
    },
    {
      name: "tag",
      principle: "Signal to noise",
      use: "For dense lists: one short line beside the pointer, such as the read time, without covering the rows around it.",
    },
  ],
  effects: [
    {
      name: "tilt",
      principle: "Follow-through",
      use: "On a showcase page: the preview leans into the pointer's direction and settles, as if carried. Reduced motion leaves it upright and without lag.",
    },
  ],
  usage: `import { HoverPreview, HoverPreviewLink } from "@/components/ui/hover-preview"

<HoverPreview aria-label="Articles" effect="tilt">
  <HoverPreviewLink
    href="/writing/search"
    aside="2026"
    preview={{
      meta: "Six minute read",
      title: "Rebuilding search",
      text: "What we changed and what we would do differently.",
      media: <img src="/search.jpg" alt="" className="size-full object-cover" />,
    }}
  >
    Rebuilding search
  </HoverPreviewLink>
</HoverPreview>`,
  exports: ["HoverPreview", "HoverPreviewLink"],
}
