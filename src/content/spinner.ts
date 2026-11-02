import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "spinner",
  title: "Spinner",
  category: "feedback",
  description: "Says work is running when nobody knows how long it will take, in four shapes, with a pulse instead of movement for people who turned motion off.",
  why: {
    principle: "Visibility of system status",
    explanation:
      "A screen that does nothing after a click looks broken, and people click again. A small moving mark answers the only question they have: is it still working? It promises nothing about how long, which is honest when you do not know.",
    avoid:
      "Do not show one for waits under about 300 ms, where the flash is worse than nothing. If you know how far along the work is, use Progress. If you know the shape of the page coming, use Skeleton.",
  },
  designs: [
    {
      name: "ring",
      principle: "Familiarity",
      use: "The default, inside buttons and beside text, where the shape needs no explaining.",
    },
    {
      name: "dots",
      principle: "Rhythm",
      use: "In conversation and inline text, where a soft sequence reads as someone composing a reply.",
    },
    {
      name: "bars",
      principle: "Jakob's law",
      use: "In native-feeling apps: eight bars around a centre are what phones have shown for years.",
    },
    {
      name: "orbit",
      principle: "Figure and ground",
      use: "On a quiet empty panel, where a thin circle and one moving dot hold the eye without adding weight.",
    },
  ],
  usage: `import { Spinner } from "@/components/ui/spinner"

<Spinner />
<Spinner variant="dots" size="sm" label="Writing a reply" />
<Spinner variant="orbit" size="lg" label="Loading invoices" showLabel />`,
  exports: ["Spinner"],
}
