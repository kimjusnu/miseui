import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "input-group",
  title: "Input Group",
  category: "forms",
  description: "One field with text, icons, buttons or a select attached to it, sharing a single border and focus ring, in four layouts.",
  why: {
    principle: "Law of uniform connectedness",
    explanation:
      "A currency code or a domain is part of the value, so it should look like part of the field. One border and one focus ring around everything make it read as a single thing to fill in, and showing the unit in the field saves people from guessing what to type.",
    avoid:
      "Do not turn a whole form into one group. Do not put two inputs in one group, as people lose track of which one is focused. An addon is not a label: the field still needs a name, which the `label` prop gives it.",
  },
  designs: [
    {
      name: "attached",
      principle: "Law of common region",
      use: "When the addon is a fixed part of the value, such as a protocol, a domain or a unit, and should look different from what is typed.",
    },
    {
      name: "inset",
      principle: "Figure and ground",
      use: "For search and short commands, where the icon and a small button stay inside and the field keeps one clean surface.",
    },
    {
      name: "stacked",
      principle: "Law of proximity",
      use: "For payment and checkout forms: the label stays visible while typing, and it saves the vertical space of a separate line.",
    },
    {
      name: "inline",
      principle: "Law of alignment",
      use: "For settings rows on a phone, with the label on the left and the value right-aligned, as system settings do.",
    },
  ],
  usage: `import {
  InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton, InputGroupSelect,
} from "@/components/ui/input-group"

<InputGroup label="Website">
  <InputGroupAddon>https://</InputGroupAddon>
  <InputGroupInput placeholder="yoursite.com" />
  <InputGroupButton>Check</InputGroupButton>
</InputGroup>

<InputGroup variant="stacked" label="Monthly budget">
  <InputGroupInput inputMode="decimal" placeholder="0.00" />
  <InputGroupSelect aria-label="Currency">
    <option>USD</option>
    <option>KRW</option>
  </InputGroupSelect>
</InputGroup>`,
  exports: ["InputGroup", "InputGroupAddon", "InputGroupInput", "InputGroupButton", "InputGroupSelect"],
}
