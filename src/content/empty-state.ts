import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "empty-state",
  title: "Empty State",
  category: "blocks",
  description: "A first screen that gives people somewhere to start, with one action and three worked examples.",
  why: {
    principle: "Blank page paralysis",
    explanation:
      "A new user on an empty screen has to imagine what the product is for before they can use it, and many leave instead. One clear action handles the people who already know. Three concrete examples handle everyone else, and they teach what the product can do without a tour.",
    avoid:
      "Do not use it for a list that is empty because a filter matched nothing. That needs a way to clear the filter, not a welcome. Keep the examples to things your product really does.",
  },
  usage: `import { EmptyState } from "@/components/empty-state"

<EmptyState
  title="Your first project starts here"
  onAction={createProject}
  onStarter={(id) => createFromTemplate(id)}
/>`,
  exports: ["EmptyState"],
}
