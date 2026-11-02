import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "color-picker",
  title: "Color Picker",
  category: "forms",
  description: "A saturation square, hue and opacity sliders, typed hex and presets, in four layouts, with a thumb that never lags behind the hand.",
  why: {
    principle: "Direct manipulation",
    explanation:
      "People judge colour by seeing it, not by reading numbers. The thumb stays exactly under the pointer and the colour changes as it moves, so the hand and the eye work as one. Hex stays available for the moment someone has a brand value to paste.",
    avoid:
      "When only a brand palette is allowed, use the swatches variant so nobody can pick an off-brand colour. Do not offer the full picker for a choice of three or four.",
  },
  designs: [
    {
      name: "popover",
      principle: "Progressive disclosure",
      use: "In a settings form, where colour is one field among many and the panel appears only when asked for.",
    },
    {
      name: "inline",
      principle: "Immediate feedback",
      use: "In a theme editor or design tool, where choosing colour is the main job and the result sits beside it.",
    },
    {
      name: "swatches",
      principle: "Hick's law",
      use: "When a short approved list is the whole choice, such as a label colour or a chart series.",
    },
    {
      name: "compact",
      principle: "Recognition over recall",
      use: "For people who know their hex: type or paste first, and open the panel from the swatch only when needed.",
    },
  ],
  effects: [
    {
      name: "spring",
      principle: "Spatial continuity",
      use: "When people click far across the square: the thumb travels there instead of teleporting, and the moment they drag it follows exactly.",
    },
  ],
  usage: `import { ColorPicker } from "@/components/ui/color-picker"

<ColorPicker defaultValue="#2563eb" label="Brand color" onValueChange={setColor} />
<ColorPicker variant="inline" effect="spring" alpha={false} />
<ColorPicker
  variant="swatches"
  label="Label color"
  swatches={[{ value: "#e11d48", label: "Rose" }, { value: "#0d9488", label: "Teal" }]}
/>`,
  exports: ["ColorPicker"],
}
