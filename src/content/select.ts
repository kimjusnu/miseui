import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "select",
  title: "Select",
  category: "core",
  description:
    "Dropdown for one choice from a list, with a placeholder, groups, a check on the chosen row and full keyboard support.",
  why: {
    principle: "Default effect",
    explanation:
      "Most people keep whatever is preselected, so the default you pass is the answer most users will give; choose it deliberately. The trigger shows the current value in place, the list opens aligned to it with the chosen row focused, and a check mark confirms the choice so the user can scan instead of reading every row.",
    avoid:
      "Skip it for fewer than four options, where radio buttons show everything at once, and for more than about fifteen, where a searchable combobox is faster. Never use it to trigger navigation on change.",
  },
  effects: [
    {
      name: "materialize",
      principle: "Spatial continuity",
      use: "Use it for a select that opens rarely, where the entrance can afford to be seen; for one opened all day, the plain list is quicker.",
    },
    {
      name: "spring",
      principle: "Object constancy",
      use: "Use it for a short list scanned by pointer or arrow keys, where one highlight travelling makes the current row easy to keep track of.",
    },
  ],
  usage: `import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select defaultValue="weekly">
  <SelectTrigger className="w-44">
    <SelectValue placeholder="Digest frequency" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="daily">Daily</SelectItem>
    <SelectItem value="weekly">Weekly</SelectItem>
    <SelectItem value="never">Never</SelectItem>
  </SelectContent>
</Select>

// <SelectContent effect="materialize"> grows the list out of the trigger; effect="spring" slides one highlight between rows.`,
  exports: [
    "Select",
    "SelectTrigger",
    "SelectValue",
    "SelectContent",
    "SelectItem",
    "SelectGroup",
    "SelectLabel",
    "SelectSeparator",
  ],
}
