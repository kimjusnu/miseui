# Checkbox

Square toggle that fills and draws its check within 150 ms of the press, and announces the change through aria-checked.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/checkbox.json
```

## Why it looks like this

**Immediate feedback.** A control that changes the instant it is pressed is trusted; one that lags feels broken. Checkbox fills and draws its check within 150 ms of the click and updates aria-checked in the same frame, so sighted users and screen readers learn about the change at the same moment.

**Don't.** Do not use a checkbox for a setting that takes effect immediately on a server; that is a Switch. Do not use it for mutually exclusive options either, which belong in a radio group.

## Effects

Pass one as the `effect` prop.

- `draw` (Peak-end rule): Use it where ticking is the reward, like a to-do list or a final confirmation; in a dense table of checkboxes the drawing slows the eye down.

## Usage

```tsx
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

<div className="flex items-center gap-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms</Label>
</div>

// effect="draw" strokes the check on a spring, as if written by hand, and retracts it when unticked.
```

Exports: `Checkbox`
