# Toggle Group

A row of buttons that stay pressed, one at a time or several at once: quiet fill, joined outline, wrapping chips or square icons.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/toggle-group.json
```

## Why it looks like this

**Law of common region.** Options that act on the same thing belong together, and placing them in one group says so before anyone reads them. Pressed state stays visible, so the current settings are on screen at all times. Arrow keys move inside the group, which means one Tab stop in place of one for every button.

**Don't.** Do not use it to submit anything or to run a one-off command; a pressed look promises a state that lasts. Single mode allows nothing selected, so when one option must always be on, use a segmented control.

## Designs

Pass one as the `variant` prop.

- `plain` (Economy of attention): In an editor toolbar, where several groups sit side by side and borders on each would become a wall of lines.
- `outline` (Law of connectedness): On its own in a form, where joined edges make it read as one control with one job.
- `pill` (Scannability): For filters with word labels, which wrap to a second line on a phone and stay easy to scan.
- `icon` (Picture superiority): For familiar formatting glyphs where width is short and the accent has to show what is on. Give each one an aria-label.

## Effects

Pass one as the `effect` prop.

- `spring` (Spatial continuity): Where the state changes a lot: in single mode the highlight slides across, and in multiple mode each highlight grows in place, since there is nothing to travel from.

## Usage

```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

<ToggleGroup type="multiple" variant="icon" aria-label="Formatting" defaultValue={["bold"]}>
  <ToggleGroupItem value="bold" aria-label="Bold"><Bold /></ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Italic"><Italic /></ToggleGroupItem>
</ToggleGroup>

<ToggleGroup variant="outline" effect="spring" defaultValue="left">…</ToggleGroup>
```

Exports: `ToggleGroup`, `ToggleGroupItem`
