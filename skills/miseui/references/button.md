# Button

Press target with a 150 ms settle and a 2% press-down so the click feels acknowledged.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/button.json
```

## Why it looks like this

**Doherty threshold.** Feedback under 400 ms keeps the user in flow. The button settles in 150 ms and dips 2% on press, so every click is visibly acknowledged before the request even starts.

**Don't.** Do not add hover lift or glow to every button. Reserve the mise variant for the single primary action on a screen; more than one and nothing is primary.

## Usage

```tsx
import { Button } from "@/components/ui/button"

<Button variant="mise">Continue</Button>
<Button variant="outline">Cancel</Button>
```

Exports: `Button`, `buttonVariants`
