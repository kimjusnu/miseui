import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "input",
  title: "Input",
  category: "core",
  description:
    "Single-line text field, 36 px tall to match Button, that moves the invalid state onto its border and ring.",
  why: {
    principle: "Fitts's law",
    explanation:
      "Smaller and farther targets take longer to hit. Input is 36 px tall with a full-width hit area, the same height as Button so form rows line up, and its invalid state lands on the border and ring where the eye already is.",
    avoid:
      "Do not shrink the height to fit more fields on screen, and do not signal errors with color alone. Pair aria-invalid with a visible message the user can read.",
  },
  effects: [
    {
      name: "glow",
      principle: "Focus of attention",
      use: "On the one field a screen is really asking for, such as a prompt box, where focus should feel like the room dimming around it.",
    },
    {
      name: "ai",
      principle: "Labor illusion",
      use: "While the model prepares a suggestion for this field, so the wait is visible where the answer will appear.",
    },
  ],
  usage: `import { Input } from "@/components/ui/input"

<Input type="email" placeholder="you@example.com" />
<Input aria-invalid placeholder="Required" />
<Input effect="ai" pending={drafting} placeholder="Drafting a title" />`,
  exports: ["Input"],
}
