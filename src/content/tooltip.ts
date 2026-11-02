import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "tooltip",
  title: "Tooltip",
  category: "core",
  description:
    "One-line hint that appears on hover or focus with no delay and leaves with the pointer, for detail that does not deserve screen space.",
  why: {
    principle: "Progressive disclosure",
    explanation:
      "Screens stay calm when secondary detail is hidden until someone asks for it. The tooltip opens the instant the pointer or keyboard focus lands, says one thing, and leaves when the pointer does, so the user gets the hint exactly when curiosity strikes and never has to dismiss it.",
    avoid:
      "Never put essential instructions, links or buttons in a tooltip: touch users cannot hover and screen readers only hear it as a description. If the text is needed to finish the task, put it on the page.",
  },
  usage: `import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="outline">Save</Button>
  </TooltipTrigger>
  <TooltipContent>Saves the draft without publishing</TooltipContent>
</Tooltip>`,
  exports: ["Tooltip", "TooltipTrigger", "TooltipContent", "TooltipProvider"],
}
