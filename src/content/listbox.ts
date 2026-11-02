import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "listbox",
  title: "Listbox",
  category: "forms",
  description: "A list you choose from that stays open, for when seeing every option is the point.",
  why: {
    principle: "Recognition over recall",
    explanation:
      "A closed select asks people to remember what is inside it. A listbox keeps the choices in view, so they can compare them without opening anything, and keyboard users can jump by typing the first letters as they would in a file list.",
    avoid:
      "Do not use it for more than about a dozen options without a search; that is a combobox. Do not use it for two or three choices, where radio buttons read faster, or for commands, which belong in a menu.",
  },
  designs: [
    {
      name: "plain",
      principle: "Figure and ground",
      use: "Inside a side panel or a settings column, where one filled row is enough to mark the choice.",
    },
    {
      name: "check",
      principle: "Signifiers",
      use: "When several can be chosen: checkboxes say so before the first click, and a single check keeps rows from shifting.",
    },
    {
      name: "card",
      principle: "Law of common region",
      use: "When each choice needs a sentence, such as plans or delivery options, and deserves its own surface.",
    },
    {
      name: "compact",
      principle: "Information density",
      use: "For long technical lists such as columns or time zones, where seeing more rows matters more than air.",
    },
  ],
  effects: [
    {
      name: "spring",
      principle: "Object constancy",
      use: "When the choice changes often and something else reacts to it: one highlight travels to the new row, so the eye follows the change.",
    },
  ],
  usage: `import { Listbox } from "@/components/ui/listbox"

const options = [
  { value: "standard", label: "Standard", description: "Three to five days" },
  { value: "express", label: "Express", description: "Next day" },
  { value: "pickup", label: "Pick up", disabled: true },
]

<Listbox aria-label="Delivery" options={options} variant="card" effect="spring" defaultValue="standard" />
<Listbox aria-label="Columns" options={options} variant="check" multiple onValueChange={setColumns} />`,
  exports: ["Listbox"],
}
