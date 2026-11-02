import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "card",
  title: "Card",
  category: "core",
  description:
    "Bordered surface with header, content and footer slots that reads as one region before anyone reads the text.",
  why: {
    principle: "Law of common region",
    explanation:
      "Elements inside a shared border and background are grouped by the eye before a single word is read. Card wraps header, content and footer in one surface with a consistent 24 px inset, so related copy and controls are understood as belonging together.",
    avoid:
      "Do not nest cards inside cards, and do not wrap a lone paragraph in one. When a region holds nothing but text, spacing alone groups it with far less visual weight.",
  },
  usage: `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Project</CardTitle>
    <CardDescription>Three open tasks</CardDescription>
  </CardHeader>
  <CardContent>…</CardContent>
  <CardFooter>…</CardFooter>
</Card>`,
  exports: ["Card", "CardHeader", "CardTitle", "CardDescription", "CardAction", "CardContent", "CardFooter"],
}
