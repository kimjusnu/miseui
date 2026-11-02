import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "separator",
  title: "Separator",
  category: "display",
  description: "A rule between groups of content, as a hairline, a dashed break, a labelled divider or a line that fades at both ends.",
  why: {
    principle: "Law of uniform connectedness",
    explanation:
      "A line is the strongest way to say two things are apart, stronger than colour or size. One hairline between two groups does that job with almost no ink, so the content stays the loudest thing in the view.",
    avoid:
      "Try spacing first: most groups separate on proximity alone, and a stack of rules turns a page into a form. Do not put a separator directly against a card edge, where the border already says the same thing.",
  },
  designs: [
    {
      name: "line",
      principle: "Figure and ground",
      use: "Between list rows and settings groups, where a single hairline is all the structure needed.",
    },
    {
      name: "dashed",
      principle: "Law of similarity",
      use: "For a lesser break inside one group, such as the line above a total on a receipt.",
    },
    {
      name: "label",
      principle: "Signposting",
      use: "When the break itself means something: a choice like Or, or a date in a message thread.",
    },
    {
      name: "gradient",
      principle: "Law of continuity",
      use: "Between big sections of a marketing page, where fading ends avoid a hard edge against wide margins.",
    },
  ],
  usage: `import { Separator } from "@/components/ui/separator"

<Separator />
<Separator variant="dashed" />
<Separator variant="label">Or continue with email</Separator>
<Separator variant="label" align="start">Yesterday</Separator>

<div className="flex items-center gap-3">
  Docs <Separator orientation="vertical" /> Pricing
</div>`,
  exports: ["Separator"],
}
