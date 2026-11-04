import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "empty-state",
  title: "Empty State",
  category: "blocks",
  description: "A first screen that gives people somewhere to start: worked examples, the first three things to do, or a ghost of the filled screen with sample data.",
  why: {
    principle: "Blank page paralysis",
    explanation:
      "A new user on an empty screen has to imagine what the product is for before they can use it, and many leave instead. One clear action handles the people who already know. Three concrete examples handle everyone else, and they teach what the product can do without a tour.",
    avoid:
      "Do not use it for a list that is empty because a filter matched nothing. That needs a way to clear the filter, not a welcome. Keep the examples to things your product really does.",
  },
  designs: [
    {
      name: "centered",
      principle: "Worked examples",
      use: "The product starts from a blank canvas, and an example says more than an explanation would.",
    },
    {
      name: "checklist",
      principle: "Goal gradient",
      use: "The product only works after some setup, so people need the next step and to see the end is close.",
    },
    {
      name: "sample",
      principle: "Try before you commit",
      use: "The value only shows once the screen is full, such as a report or a dashboard, and real data takes time to bring in.",
    },
  ],
  usage: `import { EmptyState } from "@/components/empty-state"

<EmptyState
  title="Your first project starts here"
  onAction={createProject}
  onStarter={(id) => createFromTemplate(id)}
/>

// Setup comes first. Pass completed to decide yourself when a task is done.
<EmptyState
  variant="checklist"
  tasks={[{ id: "project", title: "Create your first project", description: "Give it a name.", actionLabel: "New project" }]}
  completed={doneIds}
  onTask={openTask}
  onAction={openProject}
/>

// The screen shows its value when full. A rejected promise offers a retry.
<EmptyState
  variant="sample"
  sampleRows={rows}
  onUseSample={() => api.loadSample()}
  onClearSample={() => api.clearSample()}
  onAction={createProject}
/>`,
  exports: ["EmptyState"],
}
