# Empty State

A first screen that gives people somewhere to start, with one action and three worked examples.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/empty-state.json
```

## Why it looks like this

**Blank page paralysis.** A new user on an empty screen has to imagine what the product is for before they can use it, and many leave instead. One clear action handles the people who already know. Three concrete examples handle everyone else, and they teach what the product can do without a tour.

**Don't.** Do not use it for a list that is empty because a filter matched nothing. That needs a way to clear the filter, not a welcome. Keep the examples to things your product really does.

## Usage

```tsx
import { EmptyState } from "@/components/empty-state"

<EmptyState
  title="Your first project starts here"
  onAction={createProject}
  onStarter={(id) => createFromTemplate(id)}
/>
```

Exports: `EmptyState`
