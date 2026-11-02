# Number Input

A field for amounts that clamps to its range, repeats while a button is held and reads formatted text back.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/number-input.json
```

## Why it looks like this

**Error prevention.** A number outside the allowed range is corrected when the person leaves the field, and buttons go quiet at the limit, so a mistake cannot reach the server. Small changes take a press, larger ones a hold, and typing stays available for the jump from 5 to 500.

**Don't.** Do not use it for numbers nobody counts in: phone numbers, card numbers and postcodes want a text field. For a rough amount on a scale, a slider is kinder.

## Designs

Pass one as the `variant` prop.

- `plain` (Consistency): In a form among other inputs, where typing is the main way in and the chevrons are a quiet extra.
- `split` (Fitts's law): When people mostly nudge the value, such as quantity in a cart: two wide targets, one on each side.
- `stepper-pill` (Proximity): In a dense row such as a cart line or a settings list, where the whole control should stay the size of its number.
- `large` (Visual hierarchy): When this one number is the question on the screen, such as how many seats to buy.

## Effects

Pass one as the `effect` prop.

- `roll` (Continuity): Where the change itself is news, such as a price or a total: digits turn the short way round, so the eye sees direction and size.

## Usage

```tsx
import { NumberInput } from "@/components/ui/number-input"

<NumberInput aria-label="Quantity" defaultValue={1} min={1} max={99} />
<NumberInput variant="split" aria-label="Guests" defaultValue={2} min={1} max={12} />
<NumberInput
  variant="large"
  effect="roll"
  caption="per month"
  aria-label="Budget"
  defaultValue={1200}
  step={100}
  format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
/>
```

Exports: `NumberInput`
