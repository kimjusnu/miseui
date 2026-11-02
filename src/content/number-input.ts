import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "number-input",
  title: "Number Input",
  category: "forms",
  description: "A field for amounts that clamps to its range, repeats while a button is held and reads formatted text back.",
  why: {
    principle: "Error prevention",
    explanation:
      "A number outside the allowed range is corrected when the person leaves the field, and buttons go quiet at the limit, so a mistake cannot reach the server. Small changes take a press, larger ones a hold, and typing stays available for the jump from 5 to 500.",
    avoid:
      "Do not use it for numbers nobody counts in: phone numbers, card numbers and postcodes want a text field. For a rough amount on a scale, a slider is kinder.",
  },
  designs: [
    {
      name: "plain",
      principle: "Consistency",
      use: "In a form among other inputs, where typing is the main way in and the chevrons are a quiet extra.",
    },
    {
      name: "split",
      principle: "Fitts's law",
      use: "When people mostly nudge the value, such as quantity in a cart: two wide targets, one on each side.",
    },
    {
      name: "stepper-pill",
      principle: "Proximity",
      use: "In a dense row such as a cart line or a settings list, where the whole control should stay the size of its number.",
    },
    {
      name: "large",
      principle: "Visual hierarchy",
      use: "When this one number is the question on the screen, such as how many seats to buy.",
    },
  ],
  effects: [
    {
      name: "roll",
      principle: "Continuity",
      use: "Where the change itself is news, such as a price or a total: digits turn the short way round, so the eye sees direction and size.",
    },
  ],
  usage: `import { NumberInput } from "@/components/ui/number-input"

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
/>`,
  exports: ["NumberInput"],
}
