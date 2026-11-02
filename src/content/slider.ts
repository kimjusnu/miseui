import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "slider",
  title: "Slider",
  category: "forms",
  description:
    "Picks a value or a range by feel, as a thin line, a thick volume track, labelled steps or a value bubble, with full keyboard control.",
  why: {
    principle: "Direct manipulation",
    explanation:
      "Moving the thing itself gives instant feedback and suits values people judge by result, like volume or a price range. The fill and tick marks meet the centre of the thumb at every position, so what you see is the value you get. Arrow keys, Home and End reach any step without a pointer.",
    avoid:
      "Skip it when the exact number matters, such as a quantity or a date, because a typed field is faster and more accurate. Do not use it for ranges too wide to hit a single value at the width you have.",
  },
  designs: [
    {
      name: "plain",
      principle: "Signal to noise",
      use: "Use it for a setting in a panel, where the position is all the reader needs and the line stays out of the way.",
    },
    {
      name: "filled",
      principle: "Fitts's law",
      use: "Use it for volume or brightness on touch screens, where the whole thick track is the target and the amount reads at a glance.",
    },
    {
      name: "stepped",
      principle: "Constrained choice",
      use: "Use it when only a few values are valid, such as a priority or a size, so the ticks show every stop in advance.",
    },
    {
      name: "label",
      principle: "Immediate feedback",
      use: "Use it when the number itself matters while dragging, such as a budget or a price range, so nobody has to look elsewhere for it.",
    },
  ],
  effects: [
    {
      name: "rubber",
      principle: "Boundary feedback",
      use: "Use it where people drag hard to the ends, such as a volume control, because resistance says there is nothing further instead of just stopping.",
    },
  ],
  usage: `import { Slider } from "@/components/ui/slider"

<Slider aria-label="Brightness" defaultValue={[60]} />
<Slider aria-label="Price" defaultValue={[20, 70]} variant="label" formatValue={(value) => \`$\${value}\`} />
<Slider aria-label="Volume" defaultValue={[40]} variant="filled" effect="rubber" />
<Slider aria-label="Priority" min={1} max={5} defaultValue={[3]} variant="stepped" />`,
  exports: ["Slider"],
}
