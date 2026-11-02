import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "button",
  title: "Button",
  category: "core",
  description: "Press target with a 150 ms settle and a 2% press-down so the click feels acknowledged.",
  why: {
    principle: "Doherty threshold",
    explanation:
      "Feedback under 400 ms keeps the user in flow. The button settles in 150 ms and dips 2% on press, so every click is visibly acknowledged before the request even starts.",
    avoid:
      "Do not add hover lift or glow to every button. Reserve the mise variant for the single primary action on a screen; more than one and nothing is primary.",
  },
  usage: `import { Button } from "@/components/ui/button"

<Button variant="mise">Continue</Button>
<Button variant="outline">Cancel</Button>`,
  exports: ["Button", "buttonVariants"],
}
