import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "table-of-contents",
  title: "Table of Contents",
  category: "navigation",
  description: "Lists the sections of a page, from data or read from the headings, follows the one being read and jumps to any of them with motion that respects reduced motion.",
  why: {
    principle: "Visibility of system status",
    explanation:
      "A long page gives no sign of how much is left or where you are. The outline answers both at once, and following the section being read turns a static list into a sense of place, so people can leave and find their way back.",
    avoid:
      "Do not add one to a page with three short sections; the page is its own outline. Do not list every heading level, as more than two levels turns the map into a second article.",
  },
  designs: [
    {
      name: "line",
      principle: "Law of continuity",
      use: "The default for docs and articles: the rail reads as the length of the page and the marker as your place on it.",
    },
    {
      name: "plain",
      principle: "Figure and ground",
      use: "In a side column that already has a border or a lot around it, where a rail would be one line too many.",
    },
    {
      name: "dots",
      principle: "Serial position effect",
      use: "For content that is cited or read in order, such as terms, specifications or a long guide, where numbers give each part an address.",
    },
    {
      name: "floating",
      principle: "Fitts's law",
      use: "When the page has no spare column: a card on wide screens, and on a phone a button at the thumb that names the current section.",
    },
  ],
  effects: [
    {
      name: "spring",
      principle: "Spatial consistency",
      use: "When people scroll a lot: one marker travels between the rows, which shows the direction of movement instead of swapping highlights.",
    },
  ],
  usage: `import { TableOfContents } from "@/components/ui/table-of-contents"

// Read the headings from the article
const article = useRef<HTMLElement>(null)
<TableOfContents containerRef={article} selector="h2, h3" scrollOffset={72} effect="spring" title="On this page" />
<article ref={article}>…</article>

// Or pass them in
<TableOfContents variant="dots" items={[{ id: "returns", title: "Returns", level: 2 }]} />`,
  exports: ["TableOfContents"],
}
