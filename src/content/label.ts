import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "label",
  title: "Label",
  category: "forms",
  description:
    "Caption bound to a control: clicking it focuses the field, and it dims when the field is disabled.",
  why: {
    principle: "Law of proximity",
    explanation:
      "A caption placed next to a control is read as part of it, and binding it with htmlFor turns the whole caption into a click target that focuses the field. Label also dims through peer-disabled when its sibling control is disabled, so the pair always looks like one unit.",
    avoid:
      "Do not use Label for headings or helper text, and never ship a control without one. Placeholder text vanishes the moment the user starts typing.",
  },
  usage: `import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />`,
  exports: ["Label"],
}
