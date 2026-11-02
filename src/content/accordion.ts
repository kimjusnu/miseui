import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "accordion",
  title: "Accordion",
  category: "display",
  description: "Stacked rows that open in place, so a long page of answers stays short until someone asks for one.",
  why: {
    principle: "Progressive disclosure",
    explanation:
      "People scan questions before they read answers. Showing only the rows keeps the whole list in view and lets each reader open the one line that matters to them, with the answer appearing exactly where they were looking.",
    avoid:
      "Do not hide what most readers need; if nearly everyone opens a row, it should be plain text. Do not put required form fields inside closed rows, and do not nest accordions.",
  },
  designs: [
    {
      name: "plain",
      principle: "Figure and ground",
      use: "Inside a page or a settings column, where hairlines separate rows without adding a second surface.",
    },
    {
      name: "card",
      principle: "Law of common region",
      use: "When the rows are one topic sitting among other content, so one rounded container says they belong together.",
    },
    {
      name: "separated",
      principle: "Law of proximity",
      use: "When rows are independent items such as tickets or steps, and the open one should lift away from the rest.",
    },
    {
      name: "flush",
      principle: "Visual hierarchy",
      use: "On a marketing FAQ, where large questions carry the page and borders would only add noise.",
    },
  ],
  effects: [
    {
      name: "spring",
      principle: "Interruptibility",
      use: "When people open and close rows quickly: the height continues from where it is, so a second click reverses instead of jumping.",
    },
  ],
  usage: `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

<Accordion variant="separated" effect="spring" defaultValue="refunds">
  <AccordionItem value="refunds">
    <AccordionTrigger>How do refunds work?</AccordionTrigger>
    <AccordionContent>They land in five working days.</AccordionContent>
  </AccordionItem>
</Accordion>

<Accordion type="multiple" variant="flush" icon="plus">…</Accordion>`,
  exports: ["Accordion", "AccordionItem", "AccordionTrigger", "AccordionContent"],
}
