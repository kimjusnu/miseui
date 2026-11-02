# Steps

Shows where someone is in a process, across a line, down a column, as a bar with a count or as numbered rows, with done, current, upcoming and error states.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/steps.json
```

## Why it looks like this

**Goal gradient effect.** People work harder as they see the end approaching, and they abandon a long form less often when they can see how much is left. Done steps stay neutral so that the accent lands on the one step that needs attention now. Each step is announced as completed, current or failed, so the state does not rest on colour.

**Don't.** Do not use it for fewer than three steps or for tasks done in any order, which suit tabs or a checklist. Keep titles short, because the horizontal form wraps them in narrow columns. Do not let people jump ahead past work the later steps depend on.

## Designs

Pass one as the `variant` prop.

- `horizontal` (Law of continuity): Above a form or a checkout, with four or so short titles, where the line reads as a route from left to right.
- `vertical` (Scannability): When each step needs a sentence of explanation, such as onboarding or an order timeline.
- `compact` (Economy of attention): On a phone or in a dialog, where the count and the current title are all people need and the rest would only crowd.
- `numbered` (Serial position): In instructions and setup guides, where people refer to step three by name and the number has to be read.

## Effects

Pass one as the `effect` prop.

- `draw` (Feedback): In a flow people move through in one sitting: the line grows to the next marker when a step completes, marking the progress as it happens.

## Usage

```tsx
import { Steps } from "@/components/ui/steps"

const steps = [
  { title: "Cart" },
  { title: "Shipping", description: "Where it should go" },
  { title: "Payment", error: paymentFailed },
]

<Steps aria-label="Checkout" steps={steps} current={1} effect="draw" onStepSelect={goBackTo} />
<Steps aria-label="Checkout" variant="compact" steps={steps} current={1} />
```

Exports: `Steps`, `stepState`
