# Gradient Text

A headline painted with a gradient from theme tokens, legible in every palette, with solid fallbacks for high contrast and forced colours.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/gradient-text.json
```

## Why it looks like this

**Von Restorff effect.** The one thing painted differently on a page is the thing remembered, so one gradient headline can carry a whole screen. Every stop comes from the theme and stays in a lightness band that reads on its background, wrapped lines repaint whole, and high contrast and forced colours get solid text.

**Don't.** Headlines only, once per screen. A second gradient cancels the first, and in body text, buttons or labels it only lowers contrast and reads as a template.

## Designs

Pass one as the `variant` prop.

- `fade` (Visual hierarchy): The quiet headline of a product page: foreground easing down into muted, which adds depth without any colour.
- `accent` (Focal point): A headline that should carry the brand, foreground warming into the accent toward the end of the line.
- `aurora` (Analogous harmony): A launch or campaign moment: three neighbouring hues around the accent, which turn into a tonal sheen on a palette with no colour.
- `metal` (Specular highlight): A neutral, technical brand, where one still band of light across the words suggests a material rather than a colour.

## Effects

Pass one as the `effect` prop.

- `flow` (Ambient motion): A hero with little else moving: the colours drift slowly, stopping off screen, in a hidden tab, on hover and focus, or through the paused prop.

## Usage

```tsx
import { GradientText } from "@/components/ui/gradient-text"

<GradientText as="h1" className="text-5xl font-semibold tracking-tight">Ship the quiet version</GradientText>

<GradientText as="h1" variant="accent">Every sentence earns its place</GradientText>

<GradientText as="h2" variant="aurora" effect="flow" paused={paused}>Fewer screens, clearer choices</GradientText>
```

Exports: `GradientText`
