# Count Up

A number that counts to its value without moving what sits beside it, formatted by Intl, with rolling digits, tiles or a meter line.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/count-up.json
```

## Why it looks like this

**Change blindness.** A figure that simply appears is easy to miss. A short count points the eye at the number and shows which way it went, and because the final text holds the width, nothing around it shifts. Screen readers get the final value once, never the numbers on the way.

**Don't.** Keep it to the few figures a screen is about. Do not count in a table, a form or anything people compare or read twice, and never for a live value that changes constantly: without retarget it updates plainly, which is what those need.

## Designs

Pass one as the `variant` prop.

- `plain` (Economy of motion): A figure inside a paragraph or a stat row, where the number itself is all that should move.
- `odometer` (Physical metaphor): A total that accumulates, such as orders or downloads: wheels turning say this number builds up.
- `board` (Law of common region): A figure that is the page's main event, such as seats left or a launch count, with each digit on its own tile.
- `meter` (Dual coding): A figure with a limit, such as a quota or progress: pass max and the line shows at a glance how much of it is used.

## Effects

Pass one as the `effect` prop.

- `retarget` (Interruptibility): A figure that changes after someone acts, such as a cart total: it moves from what is showing, and a second change takes over mid-way with no jump.

## Usage

```tsx
import { CountUp } from "@/components/ui/count-up"

<CountUp value={48250} formatOptions={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} />

<CountUp value={1248} variant="odometer" />

<CountUp value={3482} variant="board" locale="en-US" />

<CountUp value={72} max={100} suffix="%" variant="meter" />

<CountUp value={total} variant="odometer" effect="retarget" />
```

Exports: `CountUp`
