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
      "Do not add hover lift or glow to every button. Reserve the mise variant for the single primary action on a screen; more than one and nothing is primary. The same goes for effects: one beam or liquid button per screen.",
  },
  effects: [
    {
      name: "liquid",
      principle: "Aesthetic-usability effect",
      use: "On the one hero control of a page, where a material cue should signal value before anyone reads the label.",
    },
    {
      name: "beam",
      principle: "Selective attention",
      use: "When this button is the single next step on the screen, so the eye knows where to go without a louder colour.",
    },
    {
      name: "shimmer",
      principle: "Labor illusion",
      use: "While the button's own request is running, so a frozen label reads as work in progress.",
    },
    {
      name: "magnetic",
      principle: "Direct manipulation",
      use: "On a primary action reached with a mouse, where the button leaning toward the pointer makes it feel ready to be pressed.",
    },
  ],
  usage: `import { Button } from "@/components/ui/button"

<Button variant="mise">Continue</Button>
<Button variant="outline">Cancel</Button>
<Button variant="mise" effect="beam">Generate</Button>`,
  exports: ["Button", "buttonVariants"],
}
