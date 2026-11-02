# Slider

Picks a value or a range by feel, as a thin line, a thick volume track, labelled steps or a value bubble, with full keyboard control.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/slider.json
```

## Why it looks like this

**Direct manipulation.** Moving the thing itself gives instant feedback and suits values people judge by result, like volume or a price range. The fill and tick marks meet the centre of the thumb at every position, so what you see is the value you get. Arrow keys, Home and End reach any step without a pointer.

**Don't.** Skip it when the exact number matters, such as a quantity or a date, because a typed field is faster and more accurate. Do not use it for ranges too wide to hit a single value at the width you have.

## Designs

Pass one as the `variant` prop.

- `plain` (Signal to noise): Use it for a setting in a panel, where the position is all the reader needs and the line stays out of the way.
- `filled` (Fitts's law): Use it for volume or brightness on touch screens, where the whole thick track is the target and the amount reads at a glance.
- `stepped` (Constrained choice): Use it when only a few values are valid, such as a priority or a size, so the ticks show every stop in advance.
- `label` (Immediate feedback): Use it when the number itself matters while dragging, such as a budget or a price range, so nobody has to look elsewhere for it.

## Effects

Pass one as the `effect` prop.

- `rubber` (Boundary feedback): Use it where people drag hard to the ends, such as a volume control, because resistance says there is nothing further instead of just stopping.

## Usage

```tsx
import { Slider } from "@/components/ui/slider"

<Slider aria-label="Brightness" defaultValue={[60]} />
<Slider aria-label="Price" defaultValue={[20, 70]} variant="label" formatValue={(value) => `$${value}`} />
<Slider aria-label="Volume" defaultValue={[40]} variant="filled" effect="rubber" />
<Slider aria-label="Priority" min={1} max={5} defaultValue={[3]} variant="stepped" />
```

Exports: `Slider`
