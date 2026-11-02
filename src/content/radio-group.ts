import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "radio-group",
  title: "Radio Group",
  category: "forms",
  description:
    "One choice from a short list with every option in view, as dots, selectable cards, joined buttons or rows, with arrow keys built in.",
  why: {
    principle: "Recognition over recall",
    explanation:
      "Every option stays on screen, so people compare what they can see instead of opening a list and remembering what it held. Selection is shown by shape as well as colour, a dot, a check or a lifted surface, so it survives any palette and colour blindness. Arrow keys move and select at once, which is what the platform has taught people to expect.",
    avoid:
      "Skip it past about six options, where a select or combobox costs less space, and for a yes or no that takes effect at once, where a switch says so better. Do not start with nothing selected if a safe default exists.",
  },
  designs: [
    {
      name: "plain",
      principle: "Familiarity",
      use: "Use it in a dense form or a settings panel, where the choice is secondary and the round mark needs no introduction.",
    },
    {
      name: "card",
      principle: "Fitts's law",
      use: "Use it when the choice is the point of the step, such as a plan or a shipping method, and each option needs a sentence and a large target.",
    },
    {
      name: "segmented",
      principle: "Proximity",
      use: "Use it for two to four short labels that switch a mode or a range in place, such as day, week and month.",
    },
    {
      name: "list",
      principle: "Scanning line",
      use: "Use it for longer labels on a phone or in a sheet, where full-width rows read straight down and the check sits on one edge.",
    },
  ],
  effects: [
    {
      name: "spring",
      principle: "Object constancy",
      use: "Use it when options sit close together and changes are frequent, because one indicator travelling shows where the choice went.",
    },
  ],
  usage: `import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

<RadioGroup aria-label="Delivery" variant="card" effect="spring" defaultValue="standard">
  <RadioGroupItem value="standard" description="Arrives in 3 to 5 days">Standard</RadioGroupItem>
  <RadioGroupItem value="express" description="Arrives tomorrow">Express</RadioGroupItem>
</RadioGroup>`,
  exports: ["RadioGroup", "RadioGroupItem"],
}
