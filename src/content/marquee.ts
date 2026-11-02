import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "marquee",
  title: "Marquee",
  category: "display",
  description: "An endless CSS-driven row that stops when someone reaches for it, and turns into a still, scrollable row for people who turned motion off.",
  why: {
    principle: "Peripheral motion",
    explanation:
      "Slow, steady movement says there is more here without asking anyone to read it, which suits a long list where no single item matters most. It holds still on hover and focus, because nobody can read or click a moving target. The compositor runs the animation, so a busy page does not make it stutter.",
    avoid:
      "Do not put anything essential in it: pricing, errors, the only link to a page. Moving content is hard to read and easy to miss. On touch there is no hover, so give a pause button through the paused prop if the row runs for long. Never fill it with logos of customers you do not have.",
  },
  designs: [
    {
      name: "plain",
      principle: "Economy of attention",
      use: "For a quiet line of updates in a footer or a header strip, where it should stay in the background.",
    },
    {
      name: "fade",
      principle: "Closure",
      use: "On an open page with no container around it: the masked edges imply the row goes on instead of being cut off.",
    },
    {
      name: "cards",
      principle: "Law of common region",
      use: "For quotes or short case notes, where each item needs its own surface and a few lines of text.",
    },
    {
      name: "logos",
      principle: "Social proof",
      use: "For tools you really integrate with or customers who agreed to be named, set as text so nothing leans on a borrowed logo file.",
    },
  ],
  usage: `import { Marquee, MarqueeItem } from "@/components/ui/marquee"

<Marquee variant="fade" aria-label="Recent releases" duration={40}>
  <MarqueeItem>Dark mode</MarqueeItem>
  <MarqueeItem>Faster search</MarqueeItem>
</Marquee>

<Marquee variant="cards" vertical reverse className="h-64">…</Marquee>`,
  exports: ["Marquee", "MarqueeItem"],
}
