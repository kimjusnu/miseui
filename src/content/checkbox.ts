import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "checkbox",
  title: "Checkbox",
  category: "core",
  description:
    "Square toggle that fills and draws its check within 150 ms of the press, and announces the change through aria-checked.",
  why: {
    principle: "Immediate feedback",
    explanation:
      "A control that changes the instant it is pressed is trusted; one that lags feels broken. Checkbox fills and draws its check within 150 ms of the click and updates aria-checked in the same frame, so sighted users and screen readers learn about the change at the same moment.",
    avoid:
      "Do not use a checkbox for a setting that takes effect immediately on a server; that is a Switch. Do not use it for mutually exclusive options either, which belong in a radio group.",
  },
  usage: `import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

<div className="flex items-center gap-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms</Label>
</div>`,
  exports: ["Checkbox"],
}
