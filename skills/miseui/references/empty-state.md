# Empty State

A first screen that gives people somewhere to start: worked examples, the first three things to do, or a ghost of the filled screen with sample data.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/empty-state.json
```

## Why it looks like this

**Blank page paralysis.** A new user on an empty screen has to imagine what the product is for before they can use it, and many leave instead. One clear action handles the people who already know. Three concrete examples handle everyone else, and they teach what the product can do without a tour.

**Don't.** Do not use it for a list that is empty because a filter matched nothing. That needs a way to clear the filter, not a welcome. Keep the examples to things your product really does.

## Designs

Pass one as the `variant` prop.

- `centered` (Worked examples): The product starts from a blank canvas, and an example says more than an explanation would.
- `checklist` (Goal gradient): The product only works after some setup, so people need the next step and to see the end is close.
- `sample` (Try before you commit): The value only shows once the screen is full, such as a report or a dashboard, and real data takes time to bring in.

## Usage

```tsx
import { EmptyState } from "@/components/empty-state"

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
/>
```

Exports: `EmptyState`
