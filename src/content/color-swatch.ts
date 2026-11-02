import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "color-swatch",
  title: "Color Swatch",
  category: "display",
  description: "Shows a colour with its name and value, alone or as a palette, with a label that stays readable on any fill and a checker under transparency.",
  why: {
    principle: "WCAG contrast",
    explanation:
      "A label printed on a colour is only legible if its ink is picked for that colour, and no single ink works for a whole palette. The tile measures contrast for each fill and takes the better of black and white. Transparent colours are judged as they appear, on the checker that makes their transparency visible.",
    avoid:
      "Do not use it to pick a colour; that is the color picker. Do not let the name alone carry meaning, since not everyone sees the difference between two fills, and keep the value visible when people need to copy it.",
  },
  designs: [
    {
      name: "circle",
      principle: "Law of similarity",
      use: "For a tight row of options such as product colours or label colours, where the fill is what people compare.",
    },
    {
      name: "square",
      principle: "Scannability",
      use: "In a list of design tokens, where people read down the names and values as much as they look at the colour.",
    },
    {
      name: "chip",
      principle: "Law of proximity",
      use: "Inside a sentence or a table cell, when a colour needs to be named without leaving the line of text.",
    },
    {
      name: "tile",
      principle: "Figure and ground",
      use: "In a brand page or a theme gallery, where the colour itself is the surface and the label has to survive on it.",
    },
  ],
  effects: [
    {
      name: "lift",
      principle: "Affordance",
      use: "On a palette people choose from. It applies only when the swatch is clickable, because movement on a static swatch would promise a click that does nothing.",
    },
  ],
  usage: `import { ColorSwatch, ColorSwatchGroup } from "@/components/ui/color-swatch"

<ColorSwatch color="#2563eb" name="Ocean" />

<ColorSwatchGroup variant="tile" aria-label="Brand palette">
  <ColorSwatch color="#1e3a8a" name="Navy" />
  <ColorSwatch color="rgb(37 99 235 / 40%)" name="Glass" />
  <ColorSwatch color="var(--mise)" name="Accent" />
</ColorSwatchGroup>`,
  exports: ["ColorSwatch", "ColorSwatchGroup"],
}
