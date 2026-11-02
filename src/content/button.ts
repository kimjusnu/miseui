import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "button",
  title: "Button",
  category: "core",
  description: "Press target that answers on pointer-down: a 3% dip in 100 ms, so the click feels acknowledged.",
  why: {
    principle: "Doherty threshold",
    explanation:
      "Feedback under 400 ms keeps the user in flow. The button answers on pointer-down, not on release: it dips 3% in 100 ms the instant it is pressed, so every click is acknowledged before the request even starts.",
    avoid:
      "Do not add hover lift or glow to every button. Reserve the mise variant for the single primary action on a screen; more than one and nothing is primary.",
  },
  usage: `import { Button } from "@/components/ui/button"

<Button variant="mise">Continue</Button>
<Button variant="outline">Cancel</Button>`,
  exports: ["Button", "buttonVariants"],
}
