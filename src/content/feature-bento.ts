import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "feature-bento",
  title: "Feature Bento",
  category: "blocks",
  description:
    "An asymmetric feature grid: mixed cell sizes, live visuals built from kit effects in some cells and large type in the others. The features shown are sample content.",
  why: {
    principle: "Aesthetic-usability effect",
    explanation:
      "Three equal cards say every feature matters the same, so visitors read none of them. Cells of different sizes rank the features before a word is read, and the big cell goes to the one that sells the product. A surface that looks considered also buys patience: people give a polished page longer and forgive more of it, which is exactly what a features section needs.",
    avoid:
      "No more than three effects may run at once on this grid: each one competes for the eye, and the liquid metal also keeps the GPU awake. Anything beyond three should move only when pressed, as the merge cell does. Do not give every cell a visual, and do not use it for features of equal weight, where a plain list is more honest.",
  },
  usage: `import { FeatureBento } from "@/components/feature-bento"

<FeatureBento
  title="After you hang up."
  titleQuiet="The notes take care of themselves."
  features={[
    { id: "summary", title: "Keeps working after you hang up.", description: "...", span: 4, visual: <YourVisual /> },
    { id: "ask", title: "Ask the call anything.", description: "...", span: 2, tone: "dark" },
    { id: "no-bot", title: "No bot in the call.", description: "...", span: 2 },
    { id: "send", title: "Goes where the team reads.", description: "...", span: 4 },
  ]}
/>`,
  exports: ["FeatureBento"],
}
