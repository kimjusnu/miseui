# Radio Group

One choice from a short list with every option in view, as dots, selectable cards, joined buttons or rows, with arrow keys built in.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/radio-group.json
```

## Why it looks like this

**Recognition over recall.** Every option stays on screen, so people compare what they can see instead of opening a list and remembering what it held. Selection is shown by shape as well as colour, a dot, a check or a lifted surface, so it survives any palette and colour blindness. Arrow keys move and select at once, which is what the platform has taught people to expect.

**Don't.** Skip it past about six options, where a select or combobox costs less space, and for a yes or no that takes effect at once, where a switch says so better. Do not start with nothing selected if a safe default exists.

## Designs

Pass one as the `variant` prop.

- `plain` (Familiarity): Use it in a dense form or a settings panel, where the choice is secondary and the round mark needs no introduction.
- `card` (Fitts's law): Use it when the choice is the point of the step, such as a plan or a shipping method, and each option needs a sentence and a large target.
- `segmented` (Proximity): Use it for two to four short labels that switch a mode or a range in place, such as day, week and month.
- `list` (Scanning line): Use it for longer labels on a phone or in a sheet, where full-width rows read straight down and the check sits on one edge.

## Effects

Pass one as the `effect` prop.

- `spring` (Object constancy): Use it when options sit close together and changes are frequent, because one indicator travelling shows where the choice went.

## Usage

```tsx
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

<RadioGroup aria-label="Delivery" variant="card" effect="spring" defaultValue="standard">
  <RadioGroupItem value="standard" description="Arrives in 3 to 5 days">Standard</RadioGroupItem>
  <RadioGroupItem value="express" description="Arrives tomorrow">Express</RadioGroupItem>
</RadioGroup>
```

Exports: `RadioGroup`, `RadioGroupItem`
