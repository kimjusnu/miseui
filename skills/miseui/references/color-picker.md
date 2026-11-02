# Color Picker

A saturation square, hue and opacity sliders, typed hex and presets, in four layouts, with a thumb that never lags behind the hand.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/color-picker.json
```

## Why it looks like this

**Direct manipulation.** People judge colour by seeing it, not by reading numbers. The thumb stays exactly under the pointer and the colour changes as it moves, so the hand and the eye work as one. Hex stays available for the moment someone has a brand value to paste.

**Don't.** When only a brand palette is allowed, use the swatches variant so nobody can pick an off-brand colour. Do not offer the full picker for a choice of three or four.

## Designs

Pass one as the `variant` prop.

- `popover` (Progressive disclosure): In a settings form, where colour is one field among many and the panel appears only when asked for.
- `inline` (Immediate feedback): In a theme editor or design tool, where choosing colour is the main job and the result sits beside it.
- `swatches` (Hick's law): When a short approved list is the whole choice, such as a label colour or a chart series.
- `compact` (Recognition over recall): For people who know their hex: type or paste first, and open the panel from the swatch only when needed.

## Effects

Pass one as the `effect` prop.

- `spring` (Spatial continuity): When people click far across the square: the thumb travels there instead of teleporting, and the moment they drag it follows exactly.

## Usage

```tsx
import { ColorPicker } from "@/components/ui/color-picker"

<ColorPicker defaultValue="#2563eb" label="Brand color" onValueChange={setColor} />
<ColorPicker variant="inline" effect="spring" alpha={false} />
<ColorPicker
  variant="swatches"
  label="Label color"
  swatches={[{ value: "#e11d48", label: "Rose" }, { value: "#0d9488", label: "Teal" }]}
/>
```

Exports: `ColorPicker`
