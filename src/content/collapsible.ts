import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "collapsible",
  title: "Collapsible",
  category: "display",
  description: "One disclosure: a label that opens the detail under it, for the one thing most readers can skip.",
  why: {
    principle: "Progressive disclosure",
    explanation:
      "A single optional detail costs attention even when nobody needs it. Folding it behind a clear label keeps the main path short, and the detail opens exactly where the reader is looking, so nothing has to be found again.",
    avoid:
      "Do not fold what most readers need, and do not use several in a row; that list is an accordion. The fade variant needs text clearly longer than its collapsed height, otherwise Show more opens almost nothing.",
  },
  designs: [
    {
      name: "plain",
      principle: "Figure and ground",
      use: "Inside a form or a settings group, where a full-width row reads as one more line of the same list.",
    },
    {
      name: "card",
      principle: "Law of common region",
      use: "When the detail stands alone on the page and needs its own surface to read as one object.",
    },
    {
      name: "fade",
      principle: "Curiosity gap",
      use: "On long text such as a job post or a release note, where a real preview tells readers whether more is worth a click.",
    },
    {
      name: "inline",
      principle: "Visual hierarchy",
      use: "Under a price or a result, for a small why-is-this question that should not compete with the content above it.",
    },
  ],
  effects: [
    {
      name: "spring",
      principle: "Interruptibility",
      use: "When people may change their mind mid-open: the height continues from where it is and reverses without a jump.",
    },
  ],
  usage: `import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"

<Collapsible variant="card" effect="spring">
  <CollapsibleTrigger>Billing details</CollapsibleTrigger>
  <CollapsibleContent>Paid by card ending 4242.</CollapsibleContent>
</Collapsible>

<Collapsible variant="fade">
  <CollapsibleContent collapsedHeight={96}>{longText}</CollapsibleContent>
  <CollapsibleTrigger />
</Collapsible>`,
  exports: ["Collapsible", "CollapsibleTrigger", "CollapsibleContent"],
}
