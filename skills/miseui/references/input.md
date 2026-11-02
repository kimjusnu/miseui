# Input

Single-line text field, 36 px tall to match Button, that moves the invalid state onto its border and ring.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/input.json
```

## Why it looks like this

**Fitts's law.** Smaller and farther targets take longer to hit. Input is 36 px tall with a full-width hit area, the same height as Button so form rows line up, and its invalid state lands on the border and ring where the eye already is.

**Don't.** Do not shrink the height to fit more fields on screen, and do not signal errors with color alone. Pair aria-invalid with a visible message the user can read.

## Effects

Pass one as the `effect` prop. The plain component stays the default.

- `glow` (Focus of attention): On the one field a screen is really asking for, such as a prompt box, where focus should feel like the room dimming around it.
- `ai` (Labor illusion): While the model prepares a suggestion for this field, so the wait is visible where the answer will appear.

## Usage

```tsx
import { Input } from "@/components/ui/input"

<Input type="email" placeholder="you@example.com" />
<Input aria-invalid placeholder="Required" />
<Input effect="ai" pending={drafting} placeholder="Drafting a title" />
```

Exports: `Input`
