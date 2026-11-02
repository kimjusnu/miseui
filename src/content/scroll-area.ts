import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "scroll-area",
  title: "Scroll Area",
  category: "display",
  description: "A scroller with a styled bar that matches the theme, as a hover bar, a thin overlay, edge shadows or a snapping row.",
  why: {
    principle: "Law of continuity",
    explanation:
      "A panel that cuts off cleanly looks finished, so people miss what is below it. Each design here says there is more in its own way, and the scroller stays reachable by keyboard, which a hand-rolled overflow box usually forgets.",
    avoid:
      "Do not nest scrollers along the same axis; the inner one traps the wheel. Do not use one for the whole page, where the browser's own bar is what people know. Give it a height, or it has nothing to scroll.",
  },
  designs: [
    {
      name: "plain",
      principle: "Signifiers",
      use: "For side panels and long lists on desktop, where a bar in its own gutter appears when the pointer enters.",
    },
    {
      name: "overlay",
      principle: "Aesthetic and minimalist design",
      use: "In tight popovers and menus: a thin bar floats over the content only while scrolling, and widens when reached for.",
    },
    {
      name: "shadow",
      principle: "Depth cue",
      use: "In a table or a modal body, where a soft shadow at an edge shows there is more behind it and fades as you arrive.",
    },
    {
      name: "snap",
      principle: "Law of closure",
      use: "For a row of cards on a phone: each flick lands on a card, and the next one peeking in invites the swipe.",
    },
  ],
  effects: [
    {
      name: "edge-fade",
      principle: "Figure and ground",
      use: "Over text or images on a plain background, where content dissolves into the surface instead of being cut off.",
    },
  ],
  usage: `import { ScrollArea } from "@/components/ui/scroll-area"

<ScrollArea className="h-64" aria-label="Release notes" effect="edge-fade">
  {notes}
</ScrollArea>

<ScrollArea variant="shadow" className="h-64">{rows}</ScrollArea>

<ScrollArea variant="snap" aria-label="Plans">
  <PlanCard className="w-64" />
  <PlanCard className="w-64" />
</ScrollArea>`,
  exports: ["ScrollArea", "edgeProgress"],
}
