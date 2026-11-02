import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "tag",
  title: "Tag",
  category: "display",
  description: "A short label that can also be pressed or removed: soft tint, outline, solid or a status dot, with status tones that never borrow the accent.",
  why: {
    principle: "Pre-attentive processing",
    explanation:
      "A small coloured shape is picked out of a list before anyone reads it, so state and category can be scanned down a page. Status colours are fixed, so success stays green even when the theme accent is amber or red. A remove button is a separate target, so taking a tag off never fires the action of the label.",
    avoid:
      "Do not rely on colour alone; the word has to say it too. Do not use a tag as a primary button, and do not stack so many on a row that nothing stands out. For a count or a small status on an object, a badge is usually enough.",
  },
  designs: [
    {
      name: "soft",
      principle: "Figure and ground",
      use: "The default in tables and cards, where many tags appear at once and each should stay quiet.",
    },
    {
      name: "outline",
      principle: "Economy of attention",
      use: "For categories and topics that carry no status, or on tinted surfaces where another fill would clash.",
    },
    {
      name: "solid",
      principle: "Von Restorff effect",
      use: "For the one label that should stand out, such as Overdue. Use it rarely, because it loses its power when repeated.",
    },
    {
      name: "dot",
      principle: "Signal to noise",
      use: "For status in a dense list, where a dot marks the state and the text stays in normal ink. Every dot colour means a state.",
    },
  ],
  effects: [
    {
      name: "collapse",
      principle: "Object constancy",
      use: "For tags people remove one after another: the row slides shut, so they can see where the rest went and carry on without hunting.",
    },
  ],
  usage: `import { Tag } from "@/components/ui/tag"

<Tag tone="success">Paid</Tag>
<Tag variant="dot" tone="warning">Pending</Tag>
<Tag onClick={toggle} pressed={active}>Design</Tag>
<Tag effect="collapse" removeLabel="Remove design" onRemove={removeDesign}>Design</Tag>`,
  exports: ["Tag"],
}
