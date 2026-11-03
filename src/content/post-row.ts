import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "post-row",
  title: "Post Row",
  category: "display",
  description: "One writing entry as a single link: a title, a date that stays on its calendar day and quiet tags.",
  why: {
    principle: "Scanning patterns",
    explanation:
      "People read a list of articles down the left edge and stop on a title, so the title is the only strong thing in the row and the date keeps to one column. The whole row is one target, which is faster to hit than a small link inside it.",
    avoid:
      "Do not put other links or buttons inside; a link cannot hold another link, so a row with actions needs a table or a card. For image-led writing, use a card.",
  },
  designs: [
    {
      name: "line",
      principle: "Alignment",
      use: "A compact list of many posts, such as a home page section, where dates line up down the right edge.",
    },
    {
      name: "stacked",
      principle: "Progressive disclosure",
      use: "A blog index, where a summary helps people decide before they click.",
    },
    {
      name: "ledger",
      principle: "Chronological order",
      use: "An archive or a changelog, where when it happened is how people find it.",
    },
  ],
  effects: [
    {
      name: "nudge",
      principle: "Directional cue",
      use: "When the row is the only call to action on the screen: a small move towards the arrow says this leads somewhere.",
    },
  ],
  usage: `import { PostRow } from "@/components/ui/post-row"

<ul>
  <li>
    <PostRow href="/notes/empty-states" title="Empty states people read" date="2026-11-03" tags={["Design"]} />
  </li>
</ul>

<PostRow variant="stacked" effect="nudge" href="/notes/pricing" title="Pricing page" date="2026-10-20" excerpt="Five versions later." meta="6 min read" />

// With a router
<PostRow as={RouterLink} href="/notes/onboarding" title="Onboarding" date="2026-09-12" />`,
  exports: ["PostRow", "formatPostDate"],
}
